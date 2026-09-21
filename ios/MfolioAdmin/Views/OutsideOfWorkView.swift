import SwiftUI

struct OutsideOfWorkView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var kind: OutsideKind = .photo
    @State private var payload = OutsideOfWorkPayload(photos: [], gamePhotos: [], games: [])
    @State private var loading = true
    @State private var error: String?
    @State private var editing: OutsideItem?
    @State private var creating = false
    /// Deleting is permanent — the row and its uploaded photo both go — so it
    /// always asks first.
    @State private var pendingDelete: OutsideItem?
    @State private var reordering = false

    private var items: [OutsideItem] { payload.items(for: kind) }

    var body: some View {
        List {
            Section {
                Picker("Kind", selection: $kind) {
                    ForEach(OutsideKind.allCases) { k in
                        Text(k.title).tag(k)
                    }
                }
                .pickerStyle(.segmented)
                .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
            }

            // Spinner on first load only; a refresh after an edit or a drag keeps
            // the list on screen instead of flashing it away.
            if loading && payload.all.isEmpty {
                Section { HStack { Spacer(); ProgressView(); Spacer() } }
            } else if items.isEmpty {
                Section {
                    ContentUnavailableView(
                        "No \(kind.title.lowercased()) yet",
                        systemImage: kind.symbol,
                        description: Text("The tile shows a “Coming soon” placeholder until you add one.")
                    )
                }
            } else {
                Section {
                    ForEach(items) { item in
                        Button { editing = item } label: { ItemRow(item: item) }
                            .buttonStyle(.plain)
                            // No full swipe: it fires the first action, which
                            // here is a permanent delete.
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(role: .destructive) {
                                    pendingDelete = item
                                } label: { Label("Delete", systemImage: "trash") }

                                Button {
                                    Task { await togglePublished(item) }
                                } label: {
                                    Label(item.published ? "Hide" : "Publish",
                                          systemImage: item.published ? "eye.slash" : "eye")
                                }
                                .tint(item.published ? .gray : .green)
                            }
                    }
                    .onMove(perform: move)
                } header: {
                    if reordering {
                        HStack(spacing: 6) { ProgressView().controlSize(.mini); Text("Saving order") }
                    }
                } footer: {
                    Text("Tap to edit. Swipe to publish, hide or delete. Tap Edit to drag into the order the site shows.")
                }
            }

            if let error {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle.fill")
                        .font(.footnote).foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("Outside of Work")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { creating = true } label: { Image(systemName: "plus") }
            }
            if items.count > 1 {
                ToolbarItem(placement: .topBarTrailing) { EditButton() }
            }
        }
        .confirmationDialog(
            "Delete “\(pendingDelete?.title ?? "")”?",
            isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } }),
            titleVisibility: .visible,
            presenting: pendingDelete
        ) { item in
            Button("Delete permanently", role: .destructive) { Task { await delete(item) } }
            if item.published {
                Button("Hide it instead") { Task { await togglePublished(item) } }
            }
        } message: { item in
            Text(item.storage_path != nil
                 ? "This removes it from the site and deletes its uploaded photo. It can't be undone."
                 : "This removes it from the site. It can't be undone.")
        }
        .refreshable { await load() }
        .task { await load() }
        .sheet(item: $editing) { item in
            OutsideItemEditor(kind: item.kind, existing: item) { await load() }
        }
        .sheet(isPresented: $creating) {
            OutsideItemEditor(kind: kind, existing: nil) { await load() }
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do {
            error = nil
            payload = try await APIClient(auth: auth)
                .get("/api/outside-of-work?all=1", as: OutsideOfWorkPayload.self)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func togglePublished(_ item: OutsideItem) async {
        do {
            try await APIClient(auth: auth)
                .patch("/api/outside-of-work/\(item.id)", body: ["is_published": !item.published])
            await load()
        } catch { self.error = error.localizedDescription }
    }

    /// Drag-to-reorder within the current tab. The new order becomes positions
    /// 1, 2, 3… and only rows whose position changed are sent — partial
    /// PATCHes of `sort_order`, which leave every other field alone.
    private func move(from source: IndexSet, to destination: Int) {
        var ordered = items
        ordered.move(fromOffsets: source, toOffset: destination)

        var changes: [(id: String, position: Int)] = []
        for (index, item) in ordered.enumerated() where item.sort_order != index + 1 {
            changes.append((item.id, index + 1))
        }
        guard !changes.isEmpty else { return }

        // Show the new order straight away; the server catches up behind it.
        for i in ordered.indices { ordered[i].sort_order = i + 1 }
        switch kind {
        case .photo: payload.photos = ordered
        case .game_photo: payload.gamePhotos = ordered
        case .game: payload.games = ordered
        }

        reordering = true
        error = nil
        Task {
            do {
                for change in changes {
                    try await APIClient(auth: auth)
                        .patch("/api/outside-of-work/\(change.id)", body: ["sort_order": change.position])
                }
            } catch {
                self.error = "Couldn't save the new order: \(error.localizedDescription)"
            }
            reordering = false
            await load()
        }
    }

    private func delete(_ item: OutsideItem) async {
        do {
            try await APIClient(auth: auth).delete("/api/outside-of-work/\(item.id)")
            await load()
        } catch { self.error = error.localizedDescription }
    }
}

private struct ItemRow: View {
    let item: OutsideItem

    var body: some View {
        HStack(spacing: 12) {
            Thumbnail(url: item.image_url, fallback: item.title)
                .frame(width: 46, height: 46)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

            VStack(alignment: .leading, spacing: 2) {
                Text(item.title).font(.body).lineLimit(1)
                HStack(spacing: 6) {
                    if let sub = item.subtitle, !sub.isEmpty {
                        Text(sub).lineLimit(1)
                    }
                    if let s = item.game_status { Text(s.label) }
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }

            Spacer(minLength: 8)

            if !item.published {
                Text("Hidden")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 7).padding(.vertical, 3)
                    .background(Color.secondary.opacity(0.15), in: Capsule())
            }
        }
        .padding(.vertical, 2)
        .contentShape(Rectangle())
    }
}

/// Remote image with a letter placeholder, so a missing cover never shows a gap.
struct Thumbnail: View {
    let url: String?
    let fallback: String

    var body: some View {
        AsyncImage(url: url.flatMap(URL.init(string:))) { phase in
            switch phase {
            case .success(let image):
                image.resizable().scaledToFill()
            default:
                ZStack {
                    Color.secondary.opacity(0.12)
                    Text(fallback.prefix(1).uppercased())
                        .font(.headline).foregroundStyle(.secondary)
                }
            }
        }
    }
}
