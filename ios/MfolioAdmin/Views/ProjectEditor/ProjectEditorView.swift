import PhotosUI
import SwiftUI

/// Write, edit and publish a project without leaving the app.
///
/// Same shape as the post editor — title and body up front, everything else
/// under Details — and the same TipTap engine for the body, so a project saved
/// here opens on the web unchanged. Saves send exactly what `ProjectForm.tsx`
/// sends, to the same endpoints.
struct ProjectEditorView: View {
    /// nil for a new project. Becomes the created id after the first save.
    let projectID: String?
    /// Which project holds each home-page slot now, so Details can say what
    /// choosing one will displace.
    var homeSlotOwners: [Int: String] = [:]
    var onChange: () -> Void = {}

    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var editor = PostBodyEditor()

    @State private var currentID: String?
    @State private var meta = ProjectMeta()
    @State private var savedMeta = ProjectMeta()

    @State private var phase: Phase = .loading
    @State private var saving = false
    @State private var error: String?
    @State private var toast: String?

    @State private var showDetails = false
    @State private var confirmLeave = false
    @State private var recovered: LocalDraftStore.Draft<ProjectMeta>?
    @State private var restoredUnsaved = false

    @State private var pickingBodyImage = false
    @State private var bodyImageItem: PhotosPickerItem?
    @State private var uploadingImage = false
    @State private var linkPrompt: LinkPrompt?
    @FocusState private var titleFocused: Bool

    private enum Phase: Equatable { case loading, ready, failed(String) }

    private var isNew: Bool { currentID == nil }
    private var draftKey: String { LocalDraftStore.projectKey(for: currentID) }
    private var hasChanges: Bool { meta != savedMeta || editor.isDirty || restoredUnsaved }

    var body: some View {
        content
            .navigationTitle(isNew ? "New Project" : "Edit Project")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden(hasChanges)
            .toolbar { toolbar }
            .sheet(isPresented: $showDetails) {
                ProjectDetailsSheet(
                    meta: $meta,
                    projectID: currentID,
                    homeSlotOwners: homeSlotOwners,
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
            .linkPrompt($linkPrompt, editor: editor)
            .confirmationDialog("Discard unsaved changes?", isPresented: $confirmLeave, titleVisibility: .visible) {
                Button("Discard changes", role: .destructive) {
                    LocalDraftStore.clear(draftKey)
                    dismiss()
                }
                Button("Keep editing", role: .cancel) {}
            } message: {
                Text("Your edits since the last save will be lost.")
            }
            .task { await load() }
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
                Label("Couldn't open the project", systemImage: "exclamationmark.triangle")
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
            if let recovered {
                DraftRecoveryBanner(
                    savedAt: recovered.savedAt,
                    onDiscard: {
                        LocalDraftStore.clear(draftKey)
                        self.recovered = nil
                    },
                    onRestore: { restore(recovered) }
                )
            }
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

            TextField("Project name", text: $meta.title, axis: .vertical)
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
                .overlay(alignment: .top) { SaveToast(message: toast) }

            FormatBar(
                editor: editor,
                onImage: { pickingBodyImage = true },
                onLink: { linkPrompt = LinkPrompt(for: editor.state) }
            )
        }
        .background(Color(.systemBackground))
    }

    /// Status, where it sits on the home page, and what's attached — the
    /// things Details changes, so tapping here opens it.
    private var statusLine: some View {
        Button { showDetails = true } label: {
            HStack(spacing: 8) {
                StatusPill(text: meta.published ? "Published" : "Draft",
                           tint: meta.published ? .green : .secondary)
                if let slot = meta.homeSlot {
                    StatusPill(text: "Home #\(slot)", tint: Theme.Accent.projects)
                }
                Text(summary).lineLimit(1)
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

    private var summary: String {
        var parts = ["\(editor.state.words) word\(editor.state.words == 1 ? "" : "s")"]
        if !meta.gallery.isEmpty { parts.append("\(meta.gallery.count) photo\(meta.gallery.count == 1 ? "" : "s")") }
        if !meta.workplace.isEmpty { parts.append(meta.workplace) }
        return parts.joined(separator: " · ")
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
            .accessibilityLabel("Project details")
            .disabled(phase != .ready)

            if saving {
                ProgressView()
            } else {
                Button(meta.published && !savedMeta.published ? "Publish" : "Save") {
                    Task { await save() }
                }
                .fontWeight(.semibold)
                .disabled(phase != .ready || !editor.isReady || uploadingImage)
            }
        }
    }

    // MARK: - Images

    private func insertBodyImage(_ item: PhotosPickerItem) async {
        uploadingImage = true
        defer { uploadingImage = false }
        do {
            try await editor.insertPhoto(item, auth: auth)
            error = nil
        } catch {
            self.error = "Image upload failed: \(error.localizedDescription)"
        }
    }

    // MARK: - Load

    private func load() async {
        phase = .loading
        error = nil
        do {
            if let projectID {
                let project = try await APIClient(auth: auth)
                    .get("/api/projects/\(projectID)", as: ProjectDetail.self)
                if project.trashed_at != nil {
                    phase = .failed("This project is in the trash. Restore it from the projects list to edit it.")
                    return
                }
                currentID = project.id
                meta = ProjectMeta(project)
                savedMeta = meta
                if let json = project.content_json, json != .null {
                    editor.load(json.foundation)
                } else {
                    editor.load(project.content_html)
                }
            } else {
                currentID = nil
                meta = ProjectMeta()
                savedMeta = meta
                editor.load(nil)
            }
            recovered = LocalDraftStore.load(draftKey, as: ProjectMeta.self)
            phase = .ready
            if isNew && recovered == nil { titleFocused = true }
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    private func restore(_ draft: LocalDraftStore.Draft<ProjectMeta>) {
        meta = draft.meta
        editor.load(draft.content?.foundation)
        recovered = nil
        restoredUnsaved = true
    }

    // MARK: - Autosave

    private var autosaveKey: String { "\(editor.revision)|\(meta.hashValue)" }

    private func autosave() async {
        guard phase == .ready, hasChanges, recovered == nil else { return }
        try? await Task.sleep(for: .seconds(2))
        guard !Task.isCancelled, hasChanges, let snap = try? await editor.snapshot() else { return }
        LocalDraftStore.save(.init(meta: meta, content: snap.json, savedAt: .now), draftKey)
    }

    // MARK: - Save

    private func save() async {
        let title = meta.title.trimmingCharacters(in: .whitespacesAndNewlines)
        let slug = meta.resolvedSlug.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else {
            error = "Add a project name first."
            titleFocused = true
            return
        }
        guard !slug.isEmpty else {
            error = "Add a URL slug in Details."
            showDetails = true
            return
        }
        let link: String?
        do { link = try meta.normalizedLink() } catch {
            self.error = error.localizedDescription
            showDetails = true
            return
        }

        saving = true
        defer { saving = false }
        do {
            let snap = try await editor.snapshot()
            guard !snap.isEmpty else {
                error = "Write something about the project before saving."
                return
            }

            func trimmedOrNil(_ s: String) -> String? {
                let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
                return t.isEmpty ? nil : t
            }

            // Field for field what ProjectForm.tsx sends.
            let payload: [String: Any?] = [
                "title": title,
                "slug": slug,
                "description": trimmedOrNil(meta.description),
                "external_url": link,
                "home_feature_order": meta.homeSlot,
                "cover_image_url": meta.coverImageURL,
                "content_json": snap.json.foundation,
                "content_html": snap.html,
                "tech_stack": meta.techStack,
                "collaborators": meta.collaborators,
                "workplace": trimmedOrNil(meta.workplace),
                "client_name": trimmedOrNil(meta.clientName),
                "published": meta.published,
                "project_date": meta.projectDay,
                "gallery_images": meta.gallery.map { image -> [String: Any] in
                    let alt = image.alt.trimmingCharacters(in: .whitespacesAndNewlines)
                    return ["image_url": image.url, "alt_text": alt.isEmpty ? NSNull() : alt]
                },
            ]

            let client = APIClient(auth: auth)
            let wasNew = isNew
            let wentLive = meta.published && !savedMeta.published
            let slotChanged = meta.homeSlot != savedMeta.homeSlot || wasNew

            let id: String
            if let currentID {
                try await client.put("/api/projects/\(currentID)", body: payload)
                id = currentID
            } else {
                let created = try await client.post("/api/projects", body: payload, as: CreatedPost.self)
                id = created.id
                currentID = created.id
                LocalDraftStore.clear(LocalDraftStore.projectKey(for: nil))
            }

            // PUT stores the slot but leaves any other project holding it too.
            // This endpoint moves it: whoever had the slot gives it up.
            if slotChanged, let slot = meta.homeSlot {
                try await client.patch("/api/projects/\(id)/home-feature-order", body: ["home_feature_order": slot])
            }

            meta.title = title
            meta.slug = slug
            meta.slugTouched = true
            if let link { meta.externalURL = link }
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
