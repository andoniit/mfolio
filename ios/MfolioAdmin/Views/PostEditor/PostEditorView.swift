import PhotosUI
import SwiftUI

/// Write, edit and publish a blog post without leaving the app.
///
/// The screen is the writing surface — title and body — with everything else
/// (URL, excerpt, cover, category, tags, publishing) one tap away in Details,
/// the way the post settings sit beside the canvas in most writing apps.
///
/// Saves go to the same `/api/posts` endpoints with the same payload as
/// `BlogForm.tsx`, so the web and the app are two editors of one post.
struct PostEditorView: View {
    /// nil for a new post. Becomes the created id after the first save.
    let postID: String?
    var onChange: () -> Void = {}

    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var editor = PostBodyEditor()

    @State private var currentID: String?
    @State private var meta = PostMeta()
    @State private var savedMeta = PostMeta()
    @State private var categories: [Taxonomy] = []
    @State private var tags: [Taxonomy] = []

    @State private var phase: Phase = .loading
    @State private var saving = false
    @State private var error: String?
    @State private var toast: String?

    @State private var showDetails = false
    @State private var confirmLeave = false
    @State private var recovered: LocalDraftStore.Draft?
    /// A restored draft differs from the server even when the editor has just
    /// loaded it "cleanly", so it counts as unsaved until the next save.
    @State private var restoredUnsaved = false

    @State private var pickingBodyImage = false
    @State private var bodyImageItem: PhotosPickerItem?
    @State private var uploadingImage = false

    @State private var linkPrompt: LinkPrompt?
    @FocusState private var titleFocused: Bool

    private enum Phase: Equatable { case loading, ready, failed(String) }

    struct LinkPrompt {
        var href: String
        var text: String
        var needsText: Bool
        var existing: Bool
    }

    private var isNew: Bool { currentID == nil }
    private var draftKey: String { LocalDraftStore.key(for: currentID) }
    private var hasChanges: Bool { meta != savedMeta || editor.isDirty || restoredUnsaved }

    var body: some View {
        content
            .navigationTitle(isNew ? "New Post" : "Edit Post")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden(hasChanges)
            .toolbar { toolbar }
            .sheet(isPresented: $showDetails) {
                PostDetailsSheet(
                    meta: $meta,
                    categories: categories,
                    tags: $tags,
                    postID: currentID,
                    onTrashed: {
                        LocalDraftStore.clear(draftKey)
                        onChange()
                        dismiss()
                    }
                )
                .environmentObject(auth)
            }
            .photosPicker(isPresented: $pickingBodyImage, selection: $bodyImageItem, matching: .images)
            .onChange(of: bodyImageItem) { _, item in
                guard let item else { return }
                bodyImageItem = nil
                Task { await insertBodyImage(item) }
            }
            .alert("Link", isPresented: linkAlertShown, presenting: linkPrompt) { prompt in
                linkAlert(prompt)
            } message: { prompt in
                Text(prompt.existing ? "Change or remove this link." : "Add a link to the selected text.")
            }
            .confirmationDialog("Discard unsaved changes?", isPresented: $confirmLeave, titleVisibility: .visible) {
                Button("Discard changes", role: .destructive) {
                    LocalDraftStore.clear(draftKey)
                    dismiss()
                }
                Button("Keep editing", role: .cancel) {}
            } message: {
                Text("Your edits since the last save will be lost.")
            }
            .onChange(of: meta.title) { _, title in
                // Follow the title until the URL is set by hand — for new posts
                // only; a published post's URL must not drift.
                if isNew, !meta.slugTouched { meta.slug = PostMeta.slugify(title) }
            }
            .task { await load() }
            // Debounced autosave to disk: every edit restarts the wait.
            .task(id: autosaveKey) { await autosave() }
    }

    // MARK: - Layout

    @ViewBuilder
    private var content: some View {
        switch phase {
        case .loading:
            ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
        case .failed(let message):
            ContentUnavailableView {
                Label("Couldn't open the post", systemImage: "exclamationmark.triangle")
            } description: {
                Text(message)
            } actions: {
                Button("Try again") { Task { await load() } }
            }
        case .ready:
            writingSurface
        }
    }

    private var writingSurface: some View {
        VStack(spacing: 0) {
            if let recovered { recoveryBanner(recovered) }
            if let error {
                ErrorCard(message: error)
                    .padding(.horizontal, Theme.gutter)
                    .background(Color(.secondarySystemBackground))
            }
            if let failure = editor.failure {
                ErrorCard(message: failure)
                    .padding(.horizontal, Theme.gutter)
                    .background(Color(.secondarySystemBackground))
            }

            TextField("Title", text: $meta.title, axis: .vertical)
                .font(.title2.weight(.bold))
                .lineLimit(1...4)
                .focused($titleFocused)
                .submitLabel(.next)
                .onSubmit { editor.focus() }
                .padding(.horizontal, Theme.gutter)
                .padding(.top, 12)

            statusLine
                .padding(.horizontal, Theme.gutter)
                .padding(.top, 6)
                .padding(.bottom, 8)

            Divider()

            PostBodyEditorView(editor: editor)
                .overlay { if !editor.isReady && editor.failure == nil { ProgressView() } }
                .overlay(alignment: .top) { toastView }

            FormatBar(
                editor: editor,
                onImage: { pickingBodyImage = true },
                onLink: { startLink() }
            )
        }
        .background(Color(.systemBackground))
    }

    /// Where the post stands, at a glance: status, length, save state. Tapping
    /// it opens Details, since that's where each of those is changed.
    private var statusLine: some View {
        Button { showDetails = true } label: {
            HStack(spacing: 8) {
                StatusPill(text: meta.published ? "Published" : "Draft",
                           tint: meta.published ? .green : .secondary)
                Text("\(editor.state.words) word\(editor.state.words == 1 ? "" : "s")")
                if !meta.slug.isEmpty {
                    Text("/blog/\(meta.slug)").lineLimit(1).truncationMode(.middle)
                }
                Spacer(minLength: 0)
                if uploadingImage {
                    ProgressView().controlSize(.mini)
                    Text("Uploading image")
                } else if hasChanges {
                    Text("Unsaved").foregroundStyle(.orange)
                }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .buttonStyle(.plain)
    }

    private func recoveryBanner(_ draft: LocalDraftStore.Draft) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "clock.arrow.circlepath").foregroundStyle(.orange)
            VStack(alignment: .leading, spacing: 1) {
                Text("Unsaved changes found").font(.subheadline.weight(.semibold))
                Text("From \(draft.savedAt.formatted(date: .abbreviated, time: .shortened))")
                    .font(.caption).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            Button("Discard") {
                LocalDraftStore.clear(draftKey)
                recovered = nil
            }
            .font(.footnote)
            Button("Restore") { restore(draft) }
                .font(.footnote.weight(.semibold))
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
        }
        .padding(.horizontal, Theme.gutter)
        .padding(.vertical, 10)
        .background(Color.orange.opacity(0.12))
    }

    @ViewBuilder
    private var toastView: some View {
        if let toast {
            Label(toast, systemImage: "checkmark.circle.fill")
                .font(.footnote.weight(.semibold))
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(.regularMaterial, in: Capsule())
                .padding(.top, 10)
                .transition(.move(edge: .top).combined(with: .opacity))
        }
    }

    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        if hasChanges {
            ToolbarItem(placement: .topBarLeading) {
                Button("Cancel") { confirmLeave = true }
            }
        }
        ToolbarItemGroup(placement: .topBarTrailing) {
            Button { showDetails = true } label: {
                Image(systemName: "slider.horizontal.3")
            }
            .accessibilityLabel("Post details")
            .disabled(phase != .ready)

            if saving {
                ProgressView()
            } else {
                Button(saveTitle) { Task { await save() } }
                    .fontWeight(.semibold)
                    .disabled(phase != .ready || !editor.isReady || uploadingImage)
            }
        }
    }

    /// "Publish" only for the save that actually takes a post live, so the
    /// button says what it's about to do.
    private var saveTitle: String {
        meta.published && !savedMeta.published ? "Publish" : "Save"
    }

    // MARK: - Links

    private var linkAlertShown: Binding<Bool> {
        Binding(get: { linkPrompt != nil }, set: { if !$0 { linkPrompt = nil } })
    }

    private func startLink() {
        let s = editor.state
        linkPrompt = LinkPrompt(
            href: s.linkHref,
            text: "",
            needsText: !s.hasSelection && !s.link,
            existing: s.link
        )
    }

    @ViewBuilder
    private func linkAlert(_ prompt: LinkPrompt) -> some View {
        if prompt.needsText {
            TextField("Text", text: Binding(
                get: { linkPrompt?.text ?? "" },
                set: { linkPrompt?.text = $0 }
            ))
        }
        TextField("https://", text: Binding(
            get: { linkPrompt?.href ?? "" },
            set: { linkPrompt?.href = $0 }
        ))
        .keyboardType(.URL)
        .textInputAutocapitalization(.never)
        .autocorrectionDisabled()

        Button(prompt.existing ? "Update" : "Add") {
            if let p = linkPrompt, let href = Self.normalizedURL(p.href) {
                editor.setLink(href, text: p.needsText ? p.text.trimmingCharacters(in: .whitespaces) : nil)
            }
            linkPrompt = nil
        }
        if prompt.existing {
            Button("Remove link", role: .destructive) {
                editor.setLink("", text: nil)
                linkPrompt = nil
            }
        }
        Button("Cancel", role: .cancel) { linkPrompt = nil }
    }

    /// Adds `https://` to a bare domain; leaves mailto:, tel:, #anchors and
    /// site-relative paths alone. Blank means nothing to add.
    static func normalizedURL(_ raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        if trimmed.hasPrefix("/") || trimmed.hasPrefix("#") { return trimmed }
        if trimmed.range(of: #"^[a-zA-Z][a-zA-Z0-9+.-]*:"#, options: .regularExpression) != nil { return trimmed }
        return "https://" + trimmed
    }

    // MARK: - Images

    private func insertBodyImage(_ item: PhotosPickerItem) async {
        uploadingImage = true
        defer { uploadingImage = false }
        do {
            guard let raw = try await item.loadTransferable(type: Data.self) else { return }
            guard let optimized = ImageOptimizer.optimize(raw) else {
                error = "That image couldn't be read."
                return
            }
            // `editor/` is where the web editor puts in-body images too.
            let uploaded = try await ImageUploader.upload(optimized, folder: "editor", auth: auth)
            editor.insertImage(url: uploaded.publicURL, alt: nil)
            error = nil
        } catch {
            self.error = "Image upload failed: \(error.localizedDescription)"
        }
    }

    // MARK: - Load

    private func load() async {
        phase = .loading
        error = nil
        let client = APIClient(auth: auth)
        do {
            // Taxonomy failing shouldn't stop you writing; the post failing should.
            async let cats = try? client.get("/api/categories", as: [Taxonomy].self)
            async let tagList = try? client.get("/api/tags", as: [Taxonomy].self)

            if let postID {
                let post = try await client.get("/api/posts/\(postID)", as: PostDetail.self)
                if post.trashed_at != nil {
                    phase = .failed("This post is in the trash. Restore it from the blog list to edit it.")
                    return
                }
                currentID = post.id
                meta = PostMeta(post)
                savedMeta = meta
                // Prefer TipTap JSON, as the web does; fall back to the HTML for
                // any post that only has that. Both load losslessly.
                if let json = post.content_json, json != .null {
                    editor.load(json.foundation)
                } else {
                    editor.load(post.content_html)
                }
            } else {
                currentID = nil
                meta = PostMeta()
                savedMeta = meta
                editor.load(nil)
            }

            categories = await cats ?? []
            tags = await tagList ?? []
            recovered = LocalDraftStore.load(draftKey)
            phase = .ready
            if isNew && recovered == nil { titleFocused = true }
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    private func restore(_ draft: LocalDraftStore.Draft) {
        meta = draft.meta
        editor.load(draft.content?.foundation)
        recovered = nil
        restoredUnsaved = true
    }

    // MARK: - Autosave

    private var autosaveKey: String {
        "\(editor.revision)|\(meta.hashValue)"
    }

    private func autosave() async {
        guard phase == .ready, hasChanges, recovered == nil else { return }
        try? await Task.sleep(for: .seconds(2))
        guard !Task.isCancelled, hasChanges, let snap = try? await editor.snapshot() else { return }
        LocalDraftStore.save(.init(meta: meta, content: snap.json, savedAt: .now), draftKey)
    }

    // MARK: - Save

    private func save() async {
        let title = meta.title.trimmingCharacters(in: .whitespacesAndNewlines)
        let slug = meta.slug.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else {
            error = "Add a title first."
            titleFocused = true
            return
        }
        guard !slug.isEmpty else {
            error = "Add a URL slug in Details."
            showDetails = true
            return
        }

        saving = true
        defer { saving = false }
        do {
            let snap = try await editor.snapshot()
            guard !snap.isEmpty else {
                error = "Write something before saving."
                return
            }

            // Field for field what BlogForm.tsx sends.
            let payload: [String: Any?] = [
                "title": title,
                "slug": slug,
                "excerpt": meta.excerpt.trimmingCharacters(in: .whitespacesAndNewlines),
                "cover_image_url": meta.coverImageURL,
                "content_json": snap.json.foundation,
                "content_html": snap.html,
                "published": meta.published,
                "published_at": meta.publishedAtISO,
                "category_id": meta.categoryID,
                "tag_ids": Array(meta.tagIDs),
            ]

            let client = APIClient(auth: auth)
            let wasNew = isNew
            let wentLive = meta.published && !savedMeta.published
            if let currentID {
                try await client.put("/api/posts/\(currentID)", body: payload)
            } else {
                let created = try await client.post("/api/posts", body: payload, as: CreatedPost.self)
                currentID = created.id
                // The "new" slot has served its purpose now the post has an id.
                LocalDraftStore.clear(LocalDraftStore.key(for: nil))
            }

            meta.title = title
            meta.slug = slug
            meta.slugTouched = true
            savedMeta = meta
            editor.markClean()
            restoredUnsaved = false
            LocalDraftStore.clear(draftKey)
            error = nil
            onChange()
            flash(wentLive ? "Published" : wasNew ? "Draft saved" : "Saved")
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func flash(_ message: String) {
        withAnimation(.spring(duration: 0.3)) { toast = message }
        Task {
            try? await Task.sleep(for: .seconds(1.6))
            withAnimation(.easeOut(duration: 0.25)) { if toast == message { toast = nil } }
        }
    }
}
