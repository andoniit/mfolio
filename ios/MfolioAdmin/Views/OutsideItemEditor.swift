import SwiftUI
import PhotosUI

/// One form for all three kinds — the labels and the extra field change, the
/// shape does not. Mirrors the web manager in `OutsideOfWorkManager.tsx`.
struct OutsideItemEditor: View {
    let kind: OutsideKind
    let existing: OutsideItem?
    let onSaved: () async -> Void

    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var subtitle = ""
    @State private var link = ""
    @State private var notes = ""
    @State private var rating: Int = 0
    @State private var gameStatus: GameStatus?
    @State private var isPublished = true
    @State private var sortOrder = 0

    @State private var imageURL: String?
    @State private var storagePath: String?
    @State private var pickedImage: UIImage?
    @State private var photoItem: PhotosPickerItem?
    /// "3.8 MB → 412 KB" once a picked photo has been shrunk.
    @State private var optimizedNote: String?

    @State private var busy = false
    @State private var uploading = false
    @State private var error: String?

    private var isEditing: Bool { existing != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField(kind.titleLabel, text: $title)
                    TextField(kind.subtitleLabel, text: $subtitle)
                }

                Section("Image") {
                    HStack(spacing: 14) {
                        Group {
                            if let pickedImage {
                                Image(uiImage: pickedImage).resizable().scaledToFill()
                            } else {
                                Thumbnail(url: imageURL, fallback: title.isEmpty ? "?" : title)
                            }
                        }
                        .frame(width: 64, height: 64)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                        VStack(alignment: .leading, spacing: 6) {
                            PhotosPicker(selection: $photoItem, matching: .images) {
                                Label(imageURL == nil && pickedImage == nil ? "Choose photo" : "Replace photo",
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

                Section("Link") {
                    TextField(kind == .food ? "Maps or Yelp link" : "Store or trailer link", text: $link)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                }

                if kind == .food {
                    Section("Rating") {
                        Picker("Rating", selection: $rating) {
                            Text("None").tag(0)
                            ForEach(1...5, id: \.self) { Text("\($0)").tag($0) }
                        }
                        .pickerStyle(.segmented)
                    }
                }

                if kind == .game {
                    Section("Status") {
                        Picker("Status", selection: $gameStatus) {
                            Text("None").tag(GameStatus?.none)
                            ForEach(GameStatus.allCases) { s in
                                Text(s.label).tag(GameStatus?.some(s))
                            }
                        }
                    }
                }

                Section {
                    TextField("Notes (optional)", text: $notes, axis: .vertical).lineLimit(1...4)
                    Stepper("Order: \(sortOrder)", value: $sortOrder, in: -50...50)
                    Toggle("Show on the site", isOn: $isPublished)
                } footer: {
                    Text("Lower order shows first.")
                }

                if let error {
                    Section {
                        Label(error, systemImage: "exclamationmark.triangle.fill")
                            .font(.footnote).foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(isEditing ? "Edit \(kind.title.dropLast())" : "New \(kind.title.dropLast())")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }
                        .disabled(busy || uploading || title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
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

    private func seed() {
        guard let e = existing else { return }
        title = e.title
        subtitle = e.subtitle ?? ""
        link = e.link_url ?? ""
        notes = e.description ?? ""
        rating = e.rating ?? 0
        gameStatus = e.game_status
        isPublished = e.published
        sortOrder = e.sort_order ?? 0
        imageURL = e.image_url
        storagePath = e.storage_path
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
            imageURL = uploaded.publicURL
            storagePath = uploaded.storagePath
            error = nil
        } catch {
            self.error = error.localizedDescription
            pickedImage = nil
            optimizedNote = nil
        }
    }

    private func save() async {
        busy = true
        defer { busy = false }

        // A photo tile with no image is an empty frame — the API rejects it too.
        if kind == .photo, (imageURL ?? "").isEmpty {
            error = "A photo needs an image."
            return
        }

        var body: [String: Any?] = [
            "kind": kind.rawValue,
            "title": title.trimmingCharacters(in: .whitespaces),
            "subtitle": subtitle.blankToNil,
            "description": notes.blankToNil,
            "image_url": imageURL?.blankToNil,
            "storage_path": storagePath?.blankToNil,
            "link_url": link.blankToNil,
            "is_published": isPublished,
            "sort_order": sortOrder,
        ]
        body["rating"] = (kind == .food && rating > 0) ? rating : nil
        body["game_status"] = (kind == .game) ? gameStatus?.rawValue : nil

        do {
            let api = APIClient(auth: auth)
            if let existing {
                try await api.patch("/api/outside-of-work/\(existing.id)", body: body)
            } else {
                try await api.post("/api/outside-of-work", body: body)
            }
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
