import SwiftUI

struct OutsideOfWorkView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var kind: OutsideKind = .photo
    @State private var payload = OutsideOfWorkPayload(photos: [], gamePhotos: [], games: [])
    @State private var loading = true
    @State private var error: String?
    @State private var editing: OutsideItem?
    @State private var creating = false

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

            if loading {
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
                            .swipeActions(edge: .trailing) {
                                Button(role: .destructive) {
                                    Task { await delete(item) }
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
                } footer: {
                    Text("Swipe a row to publish, hide, or delete. Tap to edit.")
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
