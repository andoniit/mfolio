import SwiftUI
import PhotosUI

/// One form for all three kinds — the labels and the extra field change, the
/// shape does not. Mirrors the web manager in `OutsideOfWorkManager.tsx`, and
/// applies the API's rules (`parseOutsideItemInput`) before saving: the server
/// quietly drops a bad link and trims long text, so both are caught here with
/// a reason instead.
struct OutsideItemEditor: View {
    let kind: OutsideKind
    let existing: OutsideItem?
    let onSaved: () async -> Void

    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    /// Everything the form edits, so "anything changed?" is one comparison.
    private struct Draft: Equatable {
        var title = ""
        var subtitle = ""
        var link = ""
        var notes = ""
        var gameStatus: GameStatus?
        var isPublished = true
        var imageURL: String?
        var storagePath: String?
    }

    @State private var draft = Draft()
    @State private var original = Draft()

    @State private var pickedImage: UIImage?
    @State private var photoItem: PhotosPickerItem?
    /// "3.8 MB → 412 KB" once a picked photo has been shrunk.
    @State private var optimizedNote: String?

    @State private var busy = false
    @State private var uploading = false
    @State private var error: String?
    @State private var confirmDiscard = false

    // The API's limits (outside-of-work.ts). Past them the server trims silently.
    private static let titleMax = 120
    private static let subtitleMax = 120
    private static let notesMax = 400

    private var isEditing: Bool { existing != nil }
    private var hasChanges: Bool { draft != original }
    private var needsImage: Bool { kind == .photo || kind == .game_photo }

    /// The first thing stopping a save, if any — shown under Save's section
    /// and used to disable it.
    private var problem: String? {
        let title = draft.title.trimmingCharacters(in: .whitespacesAndNewlines)
        if title.isEmpty { return nil } // Save is already disabled; no need to nag.
        if title.count > Self.titleMax { return "\(kind.titleLabel) is over \(Self.titleMax) characters." }
        if draft.subtitle.count > Self.subtitleMax { return "\(kind.subtitleLabel) is over \(Self.subtitleMax) characters." }
        if draft.notes.count > Self.notesMax { return "Notes are over \(Self.notesMax) characters." }
        if WebLink.isInvalid(draft.link) { return "The link must be a web address (https://…)." }
        if needsImage && (draft.imageURL ?? "").isEmpty && !uploading { return "Add an image — this tile shows a picture." }
        return nil
    }

    private var canSave: Bool {
        !busy && !uploading && problem == nil
            && !draft.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && (hasChanges || !isEditing)
    }

    var body: some View {
        NavigationStack {
            Form {
                if kind == .game {
                    GameSearchSection { hit in
                        draft.title = hit.name
                        // Prefer a console when one is listed — this is a PS5 shelf.
                        draft.subtitle = hit.platforms.first(where: {
                            $0.range(of: "playstation|ps5|ps4", options: [.regularExpression, .caseInsensitive]) != nil
                        }) ?? hit.platforms.first ?? draft.subtitle
                        if let image = hit.image {
                            draft.imageURL = image
                            draft.storagePath = nil
                            pickedImage = nil
                        }
                    }
                }

                Section {
                    limitedField(kind.titleLabel, text: $draft.title, max: Self.titleMax)
                    limitedField(kind.subtitleLabel, text: $draft.subtitle, max: Self.subtitleMax)
                }

                imageSection

                Section {
                    TextField("Store or trailer link", text: $draft.link)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                } header: {
                    Text("Link")
                } footer: {
                    if WebLink.isInvalid(draft.link) {
                        Text(verbatim: "That isn't a web address. Use something like https://store.playstation.com/….")
                            .foregroundStyle(.red)
                    }
                }

                if kind == .game {
                    Section("Status") {
                        Picker("Status", selection: $draft.gameStatus) {
                            Text("None").tag(GameStatus?.none)
                            ForEach(GameStatus.allCases) { s in
                                Text(s.label).tag(GameStatus?.some(s))
                            }
                        }
                    }
                }

                Section {
                    TextField("Notes (optional)", text: $draft.notes, axis: .vertical).lineLimit(1...6)
                    Toggle("Show on the site", isOn: $draft.isPublished)
                } footer: {
                    VStack(alignment: .leading, spacing: 4) {
                        if draft.notes.count > Self.notesMax - 60 {
                            Text("\(draft.notes.count)/\(Self.notesMax)")
                                .foregroundStyle(draft.notes.count > Self.notesMax ? .red : .secondary)
                        }
                        Text("To change where it sits, drag it in the list.")
                    }
                }

                if let message = error ?? problem {
                    Section {
                        Label(message, systemImage: "exclamationmark.triangle.fill")
                            .font(.footnote).foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(isEditing ? "Edit \(kind.title.dropLast())" : "New \(kind.title.dropLast())")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        if hasChanges { confirmDiscard = true } else { dismiss() }
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }
                        .disabled(!canSave)
                }
            }
            // A swipe down would throw edits away without asking.
            .interactiveDismissDisabled(hasChanges || uploading)
            .confirmationDialog("Discard your changes?", isPresented: $confirmDiscard, titleVisibility: .visible) {
                Button("Discard changes", role: .destructive) { dismiss() }
                Button("Keep editing", role: .cancel) {}
            }
            .onAppear(perform: seed)
            .onChange(of: photoItem) { _, item in
                Task { await loadPicked(item) }
            }
            .overlay {
                if busy {
                    ProgressView().controlSize(.large)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(.ultraThinMaterial)
                }
            }
        }
    }

    /// A text field that shows a character count once it gets near the limit,
    /// red past it.
    private func limitedField(_ label: String, text: Binding<String>, max: Int) -> some View {
        HStack {
            TextField(label, text: text)
            if text.wrappedValue.count > max - 20 {
                Text("\(text.wrappedValue.count)/\(max)")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(text.wrappedValue.count > max ? .red : .secondary)
            }
        }
    }

    private var imageSection: some View {
        Section("Image") {
            HStack(spacing: 14) {
                Group {
                    if let pickedImage {
                        Image(uiImage: pickedImage).resizable().scaledToFill()
                    } else {
                        Thumbnail(url: draft.imageURL, fallback: draft.title.isEmpty ? "?" : draft.title)
                    }
                }
                .frame(width: 64, height: 64)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 6) {
                    PhotosPicker(selection: $photoItem, matching: .images) {
                        Label(draft.imageURL == nil && pickedImage == nil ? "Choose photo" : "Replace photo",
                              systemImage: "photo.on.rectangle")
                    }
                    if uploading {
                        HStack(spacing: 6) {
                            ProgressView().controlSize(.small)
                            Text("Optimising and uploading…")
                        }
                        .font(.caption).foregroundStyle(.secondary)
                    } else if let optimizedNote {
                        Label(optimizedNote, systemImage: "wand.and.stars")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
            }
        }
    }

    private func seed() {
        guard let e = existing, original == Draft() else { return }
        let loaded = Draft(
            title: e.title,
            subtitle: e.subtitle ?? "",
            link: e.link_url ?? "",
            notes: e.description ?? "",
            gameStatus: e.game_status,
            isPublished: e.published,
            imageURL: e.image_url,
            storagePath: e.storage_path
        )
        draft = loaded
        original = loaded
    }

    private func loadPicked(_ item: PhotosPickerItem?) async {
        guard let item else { return }
        uploading = true
        defer { uploading = false }
        do {
            guard let raw = try await item.loadTransferable(type: Data.self) else { return }

            // Shrink before anything else touches it: the original off the
            // camera roll can be 5-10MB, and decoding it whole would spike
            // memory far past what the upload needs.
            guard let optimized = ImageOptimizer.optimize(raw) else {
                error = "That image couldn't be read."
                return
            }

            // Preview comes from the optimised bytes, so what you see is what
            // gets uploaded.
            pickedImage = UIImage(data: optimized.data)
            optimizedNote = optimized.didShrink ? optimized.summary : nil

            let uploaded = try await ImageUploader.upload(
                optimized, folder: kind.storageFolder, auth: auth
            )
            draft.imageURL = uploaded.publicURL
            draft.storagePath = uploaded.storagePath
            error = nil
        } catch {
            self.error = error.localizedDescription
            pickedImage = nil
            optimizedNote = nil
        }
    }

    private func save() async {
        guard problem == nil else { return }
        busy = true
        defer { busy = false }

        let link: String?
        do { link = try WebLink.normalize(draft.link, field: "The link") } catch {
            self.error = error.localizedDescription
            return
        }

        let body: [String: Any?] = [
            "kind": kind.rawValue,
            "title": draft.title.trimmingCharacters(in: .whitespaces),
            "subtitle": draft.subtitle.blankToNil,
            "description": draft.notes.blankToNil,
            "image_url": draft.imageURL?.blankToNil,
            "storage_path": draft.storagePath?.blankToNil,
            "link_url": link,
            "is_published": draft.isPublished,
            // New items go first (0); edits keep their place in the list.
            "sort_order": existing?.sort_order ?? 0,
            // In the literal on purpose: `body["game_status"] = nil` *removes*
            // the key, so the PATCH would skip it and a cleared status would
            // never clear. Here nil is kept and goes out as JSON null.
            "game_status": kind == .game ? draft.gameStatus?.rawValue : nil,
        ]

        do {
            let api = APIClient(auth: auth)
            if let existing {
                try await api.patch("/api/outside-of-work/\(existing.id)", body: body)
            } else {
                try await api.post("/api/outside-of-work", body: body)
            }
            original = draft
            await onSaved()
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

private extension String {
    var blankToNil: String? {
        let t = trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }
}
