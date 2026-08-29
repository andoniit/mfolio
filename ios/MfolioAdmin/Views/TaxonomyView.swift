import SwiftUI

/// Categories and tags. They have the same shape — a name and a generated
/// slug — so one screen covers both, picked by `kind`.
struct TaxonomyView: View {
    enum Kind: String {
        case categories, tags

        var title: String { self == .categories ? "Categories" : "Tags" }
        var singular: String { self == .categories ? "category" : "tag" }
        var icon: String { self == .categories ? "folder" : "tag" }
        var path: String { "/api/\(rawValue)" }
    }

    let kind: Kind

    @EnvironmentObject private var auth: AuthStore
    @State private var items: [Taxonomy] = []
    @State private var newName = ""
    @State private var loading = true
    @State private var busy = false
    @State private var error: String?

    var body: some View {
        List {
            if let error {
                Section { ErrorCard(message: error) { Task { await load() } } }
            }

            Section("Add") {
                HStack {
                    TextField("New \(kind.singular)", text: $newName)
                        .autocorrectionDisabled()
                        .onSubmit(add)
                    Button("Add", action: add)
                        .buttonStyle(.borderedProminent)
                        .controlSize(.small)
                        .disabled(busy || newName.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }

            if items.isEmpty && !loading {
                Section { ContentUnavailableView("No \(kind.rawValue)", systemImage: kind.icon) }
            } else {
                Section("\(kind.title) (\(items.count))") {
                    ForEach(items) { item in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name)
                            if let slug = item.slug {
                                Text(slug).font(.caption2).foregroundStyle(.tertiary)
                            }
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) { remove(item) } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(kind.title)
        .navigationBarTitleDisplayMode(.inline)
        .overlay { if loading && items.isEmpty { ProgressView() } }
        .refreshable { await load() }
        .task { await load() }
    }

    private func client() -> APIClient { APIClient(auth: auth) }

    private func add() {
        let name = newName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        busy = true; error = nil
        Task {
            do {
                try await client().post(kind.path, body: ["name": name])
                newName = ""
                await load()
            } catch { self.error = error.localizedDescription }
            busy = false
        }
    }

    private func remove(_ item: Taxonomy) {
        busy = true; error = nil
        Task {
            do {
                try await client().delete("\(kind.path)/\(item.id)")
                await load()
            } catch { self.error = error.localizedDescription }
            busy = false
        }
    }

    private func load() async {
        loading = true
        do {
            items = try await client().get(kind.path, as: [Taxonomy].self)
            error = nil
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}
