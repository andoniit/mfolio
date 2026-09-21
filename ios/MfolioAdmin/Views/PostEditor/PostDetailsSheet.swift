import PhotosUI
import SwiftUI

/// Everything about a post that isn't the writing: publishing, URL, excerpt,
/// cover, category and tags — the sidebar of the web form. Edits go straight
/// into the editor's `meta`, so they're saved with the next Save.
struct PostDetailsSheet: View {
    @Binding var meta: PostMeta
    let categories: [Taxonomy]
    @Binding var tags: [Taxonomy]
    let postID: String?
    var onTrashed: () -> Void

    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    @State private var coverItem: PhotosPickerItem?
    @State private var coverPreview: UIImage?
    @State private var coverNote: String?
    @State private var uploadingCover = false

    @State private var newTag = ""
    @State private var creatingTag = false
    @State private var confirmTrash = false
    @State private var trashing = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                if let error {
                    Section { ErrorCard(message: error) }
                }
                publishSection
                urlSection
                excerptSection
                coverSection
                categorySection
                tagsSection
                if postID != nil { trashSection }
            }
            .navigationTitle("Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }.disabled(uploadingCover)
                }
            }
            .onChange(of: coverItem) { _, item in
                guard let item else { return }
                Task { await uploadCover(item) }
            }
            .confirmationDialog("Move this post to the trash?", isPresented: $confirmTrash, titleVisibility: .visible) {
                Button("Move to Trash", role: .destructive) { Task { await trash() } }
            } message: {
                Text("It comes off the site straight away. You can restore it from Trash in the blog list.")
            }
        }
    }

    // MARK: - Sections

    private var publishSection: some View {
        Section {
            Toggle("Published", isOn: $meta.published)
            DatePicker("Publish date", selection: publishDate, displayedComponents: .date)
                .disabled(!meta.published)
        } header: {
            Text("Status")
        } footer: {
            Text(meta.published
                 ? "Goes live on the site when you save."
                 : "Stays a draft — only you can see it.")
        }
    }

    private var urlSection: some View {
        Section {
            TextField("post-url", text: Binding(
                get: { meta.resolvedSlug },
                set: {
                    meta.slug = $0
                    meta.slugTouched = true
                }
            ))
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .keyboardType(.asciiCapable)
            .font(.body.monospaced())

            if meta.resolvedSlug != PostMeta.slugify(meta.title), !meta.title.isEmpty {
                Button("Use title: \(PostMeta.slugify(meta.title))") {
                    meta.slug = PostMeta.slugify(meta.title)
                    meta.slugTouched = true
                }
                .font(.footnote)
                .lineLimit(1)
            }
        } header: {
            Text("URL")
        } footer: {
            VStack(alignment: .leading, spacing: 4) {
                if meta.resolvedSlug.isEmpty {
                    Text("A URL is needed to save.").foregroundStyle(.red)
                }
                Text(verbatim: "\(AppConfig.siteURL)/blog/\(meta.resolvedSlug.isEmpty ? "…" : meta.resolvedSlug)")
                if postID != nil && meta.published {
                    Text("Changing this breaks links to the old address.")
                        .foregroundStyle(.orange)
                }
            }
        }
    }

    private var excerptSection: some View {
        Section {
            TextField("A short summary for the blog grid and link previews", text: $meta.excerpt, axis: .vertical)
                .lineLimit(3...8)
        } header: {
            Text("Excerpt")
        } footer: {
            if !meta.excerpt.isEmpty { Text("\(meta.excerpt.count) characters") }
        }
    }

    private var coverSection: some View {
        Section {
            if let image = coverPreview {
                coverFrame(Image(uiImage: image).resizable())
            } else if let url = meta.coverImageURL.flatMap(URL.init(string:)) {
                coverFrame(
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image): image.resizable()
                        case .failure: Color(.tertiarySystemFill).overlay { Image(systemName: "photo") }
                        default: Color(.tertiarySystemFill).overlay { ProgressView() }
                        }
                    }
                )
            }

            PhotosPicker(selection: $coverItem, matching: .images) {
                HStack {
                    Label(meta.coverImageURL == nil ? "Choose cover image" : "Replace cover image",
                          systemImage: "photo.on.rectangle")
                    Spacer()
                    if uploadingCover { ProgressView() }
                }
            }
            .disabled(uploadingCover)

            if meta.coverImageURL != nil {
                Button("Remove cover image", role: .destructive) {
                    meta.coverImageURL = nil
                    coverPreview = nil
                    coverNote = nil
                }
            }
        } header: {
            Text("Cover image")
        } footer: {
            if let coverNote { Text("Optimised on the phone: \(coverNote)") }
        }
    }

    private func coverFrame(_ image: some View) -> some View {
        image
            .aspectRatio(contentMode: .fill)
            .frame(maxWidth: .infinity)
            .frame(height: 180)
            .clipShape(RoundedRectangle(cornerRadius: Theme.tileCorner, style: .continuous))
            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
    }

    private var categorySection: some View {
        Section("Category") {
            Picker("Category", selection: $meta.categoryID) {
                Text("None").tag(String?.none)
                ForEach(categories) { Text($0.name).tag(Optional($0.id)) }
            }
            .pickerStyle(.navigationLink)
        }
    }

    private var tagsSection: some View {
        Section {
            if tags.isEmpty {
                Text("No tags yet — add the first one below.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            ForEach(tags) { tag in
                Button {
                    if meta.tagIDs.contains(tag.id) { meta.tagIDs.remove(tag.id) }
                    else { meta.tagIDs.insert(tag.id) }
                } label: {
                    HStack {
                        Text(tag.name).foregroundStyle(Color.primary)
                        Spacer()
                        if meta.tagIDs.contains(tag.id) {
                            Image(systemName: "checkmark").foregroundStyle(Color.accentColor)
                        }
                    }
                }
            }
            HStack {
                TextField("New tag", text: $newTag)
                    .textInputAutocapitalization(.never)
                    .submitLabel(.done)
                    .onSubmit { Task { await createTag() } }
                if creatingTag {
                    ProgressView()
                } else {
                    Button("Add") { Task { await createTag() } }
                        .disabled(newTag.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        } header: {
            Text("Tags")
        } footer: {
            if !meta.tagIDs.isEmpty { Text("\(meta.tagIDs.count) selected") }
        }
    }

    private var trashSection: some View {
        Section {
            Button(role: .destructive) { confirmTrash = true } label: {
                HStack {
                    Label("Move to Trash", systemImage: "trash")
                    Spacer()
                    if trashing { ProgressView() }
                }
            }
            .disabled(trashing)
        }
    }

    // MARK: - Bindings

    /// The picker works in `Date`; the model keeps a plain day string.
    private var publishDate: Binding<Date> {
        let local = PostMeta.dayFormatter(utc: false)
        return Binding(
            get: { local.date(from: meta.publishDay) ?? .now },
            set: { meta.publishDay = local.string(from: $0) }
        )
    }

    // MARK: - Actions

    private func uploadCover(_ item: PhotosPickerItem) async {
        uploadingCover = true
        defer {
            uploadingCover = false
            coverItem = nil
        }
        do {
            guard let raw = try await item.loadTransferable(type: Data.self) else { return }
            guard let optimized = ImageOptimizer.optimize(raw) else {
                error = "That image couldn't be read."
                return
            }
            coverPreview = UIImage(data: optimized.data)
            coverNote = optimized.didShrink ? optimized.summary : nil
            // `covers/` matches the web form's ImageUpload default.
            let uploaded = try await ImageUploader.upload(optimized, folder: "covers", auth: auth)
            meta.coverImageURL = uploaded.publicURL
            error = nil
        } catch {
            coverPreview = nil
            coverNote = nil
            self.error = "Cover upload failed: \(error.localizedDescription)"
        }
    }

    private func createTag() async {
        let name = newTag.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty, !creatingTag else { return }

        // Picking an existing tag beats creating a near-duplicate.
        if let existing = tags.first(where: { $0.name.caseInsensitiveCompare(name) == .orderedSame }) {
            meta.tagIDs.insert(existing.id)
            newTag = ""
            return
        }

        creatingTag = true
        defer { creatingTag = false }
        do {
            let created = try await APIClient(auth: auth).post("/api/tags", body: ["name": name], as: Taxonomy.self)
            if !tags.contains(where: { $0.id == created.id }) {
                tags.append(created)
                tags.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
            }
            meta.tagIDs.insert(created.id)
            newTag = ""
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func trash() async {
        guard let postID else { return }
        trashing = true
        defer { trashing = false }
        do {
            try await APIClient(auth: auth).delete("/api/posts/\(postID)")
            dismiss()
            onTrashed()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
