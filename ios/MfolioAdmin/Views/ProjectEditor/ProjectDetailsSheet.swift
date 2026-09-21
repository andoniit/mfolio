import PhotosUI
import SwiftUI

/// Everything about a project except the writing — the web form's sidebar.
/// Edits land in the editor's `meta` and are saved with the next Save.
///
/// The lists (gallery, tech stack, collaborators) are ordered on the site, so
/// they reorder here: tap Edit and drag.
struct ProjectDetailsSheet: View {
    @Binding var meta: ProjectMeta
    let projectID: String?
    let homeSlotOwners: [Int: String]
    var onTrashed: () -> Void

    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    @State private var coverItem: PhotosPickerItem?
    @State private var coverPreview: UIImage?
    @State private var uploadingCover = false

    @State private var galleryItems: [PhotosPickerItem] = []
    @State private var galleryUploading = 0

    @State private var confirmTrash = false
    @State private var trashing = false
    @State private var error: String?

    private var busy: Bool { uploadingCover || galleryUploading > 0 }

    var body: some View {
        NavigationStack {
            Form {
                if let error { Section { ErrorCard(message: error) } }
                statusSection
                urlSection
                aboutSection
                linksSection
                EditableListSection(title: "Tech stack", items: $meta.techStack,
                                    placeholder: "Add a technology", empty: "Nothing listed yet.")
                EditableListSection(title: "Collaborators", items: $meta.collaborators,
                                    placeholder: "Add a person", empty: "Just you, so far.")
                coverSection
                gallerySection
                if projectID != nil { trashSection }
            }
            .navigationTitle("Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { EditButton() }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }.disabled(busy)
                }
            }
            .onChange(of: coverItem) { _, item in
                guard let item else { return }
                Task { await uploadCover(item) }
            }
            .onChange(of: galleryItems) { _, items in
                guard !items.isEmpty else { return }
                galleryItems = []
                Task { await uploadGallery(items) }
            }
            .confirmationDialog("Move this project to the trash?", isPresented: $confirmTrash, titleVisibility: .visible) {
                Button("Move to Trash", role: .destructive) { Task { await trash() } }
            } message: {
                Text("It comes off the site straight away. You can restore it from Trash in the projects list.")
            }
        }
    }

    // MARK: - Sections

    private var statusSection: some View {
        Section {
            Toggle("Published", isOn: $meta.published)
            DatePicker("Project date", selection: projectDate, displayedComponents: .date)
            Picker("Home page", selection: $meta.homeSlot) {
                Text("Not featured").tag(Int?.none)
                ForEach(1...4, id: \.self) { slot in
                    Text(slotLabel(slot)).tag(Optional(slot))
                }
            }
        } header: {
            Text("Status")
        } footer: {
            Text(statusFooter)
        }
    }

    /// "Slot 2 · Portfolio v3" when someone else holds it, so choosing it
    /// says what it will move off the home page.
    private func slotLabel(_ slot: Int) -> String {
        if let owner = homeSlotOwners[slot] { return "Slot \(slot) · replaces \(owner)" }
        return "Slot \(slot)"
    }

    private var statusFooter: String {
        var lines = [meta.published ? "Goes live on the site when you save." : "Stays a draft — only you can see it."]
        if let slot = meta.homeSlot, let owner = homeSlotOwners[slot] {
            lines.append("Saving moves \(owner) off home slot \(slot).")
        }
        return lines.joined(separator: " ")
    }

    private var urlSection: some View {
        Section {
            TextField("project-url", text: Binding(
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

            if !meta.title.isEmpty, meta.resolvedSlug != PostMeta.slugify(meta.title) {
                Button("Use name: \(PostMeta.slugify(meta.title))") {
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
                Text(verbatim: "\(AppConfig.siteURL)/projects/\(meta.resolvedSlug.isEmpty ? "…" : meta.resolvedSlug)")
                if projectID != nil && meta.published {
                    Text("Changing this breaks links to the old address.").foregroundStyle(.orange)
                }
            }
        }
    }

    private var aboutSection: some View {
        Section {
            TextField("A line or two for the project card", text: $meta.description, axis: .vertical)
                .lineLimit(2...6)
            TextField("Workplace", text: $meta.workplace)
            TextField("Client", text: $meta.clientName)
        } header: {
            Text("About")
        }
    }

    private var linksSection: some View {
        Section {
            TextField("https://", text: $meta.externalURL)
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
        } header: {
            Text("Project link")
        } footer: {
            // Checked as you type: Save sends you back here on a bad link, and
            // this is where you need to read why.
            if linkIsInvalid {
                // Verbatim, or SwiftUI turns the example into a live link.
                Text(verbatim: "That isn't a web address. Use something like https://example.com.")
                    .foregroundStyle(.red)
            } else {
                Text("Where the project lives — a site, a repo, an App Store page.")
            }
        }
    }

    private var linkIsInvalid: Bool { WebLink.isInvalid(meta.externalURL) }

    private var coverSection: some View {
        Section {
            if let image = coverPreview {
                coverFrame(Image(uiImage: image).resizable())
            } else if let url = meta.coverImageURL.flatMap(URL.init(string:)) {
                coverFrame(RemoteImage(url: url))
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
                }
            }
        } header: {
            Text("Cover image")
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

    private var gallerySection: some View {
        Section {
            ForEach($meta.gallery) { $image in
                HStack(spacing: 12) {
                    RemoteImage(url: URL(string: image.url))
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 56, height: 56)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    TextField("Describe this image", text: $image.alt, axis: .vertical)
                        .font(.subheadline)
                        .lineLimit(1...3)
                }
            }
            .onDelete { meta.gallery.remove(atOffsets: $0) }
            .onMove { meta.gallery.move(fromOffsets: $0, toOffset: $1) }

            PhotosPicker(selection: $galleryItems, maxSelectionCount: 12, matching: .images) {
                HStack {
                    Label("Add photos", systemImage: "photo.stack")
                    Spacer()
                    if galleryUploading > 0 {
                        ProgressView()
                        Text("\(galleryUploading) left").font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
            .disabled(galleryUploading > 0)
        } header: {
            Text("Gallery (\(meta.gallery.count))")
        } footer: {
            Text("Shown in this order on the project page. Descriptions become the images' alt text, for screen readers and search.")
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

    private var projectDate: Binding<Date> {
        let local = PostMeta.dayFormatter(utc: false)
        return Binding(
            get: { local.date(from: meta.projectDay) ?? .now },
            set: { meta.projectDay = local.string(from: $0) }
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
            let (url, preview) = try await upload(item, folder: "covers")
            coverPreview = preview
            meta.coverImageURL = url
            error = nil
        } catch {
            self.error = "Cover upload failed: \(error.localizedDescription)"
        }
    }

    /// One at a time, appended as each finishes, so a failure part-way keeps
    /// the ones that made it and says which didn't.
    private func uploadGallery(_ items: [PhotosPickerItem]) async {
        galleryUploading = items.count
        var failed = 0
        for item in items {
            do {
                // `gallery/` matches the web form's gallery uploads.
                let (url, _) = try await upload(item, folder: "gallery")
                meta.gallery.append(GalleryImage(url: url, alt: ""))
            } catch {
                failed += 1
            }
            galleryUploading -= 1
        }
        error = failed > 0 ? "\(failed) of \(items.count) photos couldn't be uploaded." : nil
    }

    private func upload(_ item: PhotosPickerItem, folder: String) async throws -> (String, UIImage?) {
        guard let raw = try await item.loadTransferable(type: Data.self) else {
            throw APIError(status: -1, message: "That photo couldn't be loaded.")
        }
        guard let optimized = ImageOptimizer.optimize(raw) else {
            throw APIError(status: -1, message: "That image couldn't be read.")
        }
        let uploaded = try await ImageUploader.upload(optimized, folder: folder, auth: auth)
        return (uploaded.publicURL, UIImage(data: optimized.data))
    }

    private func trash() async {
        guard let projectID else { return }
        trashing = true
        defer { trashing = false }
        do {
            try await APIClient(auth: auth).delete("/api/projects/\(projectID)")
            dismiss()
            onTrashed()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

/// An uploaded image with a quiet placeholder while it loads.
private struct RemoteImage: View {
    let url: URL?
    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .success(let image): image.resizable()
            case .failure: Color(.tertiarySystemFill).overlay { Image(systemName: "photo").foregroundStyle(.secondary) }
            default: Color(.tertiarySystemFill).overlay { ProgressView() }
            }
        }
    }
}
