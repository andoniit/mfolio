import SwiftUI

/// Work history and voluntary roles — the same `experiences` table split by
/// `category`, so one screen serves both entries on the dashboard. Adding and
/// editing are native; Edit lets you drag roles into the order the site shows.
struct ExperienceView: View {
    let category: String       // "work" or "volunteer"
    let title: String

    @EnvironmentObject private var auth: AuthStore
    @State private var items: [ExperienceItem] = []
    @State private var loading = true
    @State private var busyID: String?
    @State private var error: String?
    @State private var reordering = false

    /// In the site's order: by position, then newest first — the API's order.
    private var live: [ExperienceItem] { items.filter { !$0.isTrashed } }
    private var trashed: [ExperienceItem] { items.filter(\.isTrashed) }

    var body: some View {
        List {
            if let error {
                Section { ErrorCard(message: error) { Task { await load() } } }
            }

            Section {
                NavigationLink {
                    ExperienceEditorView(item: nil, category: category) { Task { await load() } }
                } label: {
                    Label("Add \(title.lowercased())", systemImage: "plus")
                }
            }

            if live.isEmpty && !loading {
                Section { ContentUnavailableView("Nothing yet", systemImage: "briefcase") }
            } else {
                Section {
                    ForEach(live) { item in row(item) }
                        .onMove(perform: move)
                } header: {
                    HStack {
                        Text("\(title) (\(live.count))")
                        if reordering { ProgressView().controlSize(.mini) }
                    }
                } footer: {
                    Text("Tap to edit. Swipe to publish or trash. Tap Edit to drag into order.")
                }
            }

            if !trashed.isEmpty {
                Section("Trash (\(trashed.count))") {
                    ForEach(trashed) { item in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(item.title).foregroundStyle(.secondary)
                                Text(item.company).font(.caption).foregroundStyle(.tertiary)
                            }
                            Spacer()
                            if busyID == item.id { ProgressView().controlSize(.mini) }
                            Button("Restore") {
                                act(item.id) {
                                    try await client().post("/api/experiences/\(item.id)/restore", body: [:])
                                }
                            }
                            .buttonStyle(.bordered).controlSize(.small)
                        }
                    }
                }
            }
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { if live.count > 1 { EditButton() } }
        .overlay { if loading && items.isEmpty { ProgressView() } }
        .refreshable { await load() }
        .task { await load() }
    }

    private var webSegment: String { category == "volunteer" ? "volunteer" : "experience" }

    private func row(_ item: ExperienceItem) -> some View {
        NavigationLink {
            ExperienceEditorView(item: item, category: category) { Task { await load() } }
        } label: {
            VStack(alignment: .leading, spacing: 3) {
                Text(item.title)
                Text(item.company).font(.caption).foregroundStyle(.secondary)
                HStack(spacing: 6) {
                    if !item.dateLine.isEmpty {
                        Text(item.dateLine).font(.caption2).foregroundStyle(.tertiary)
                    }
                    StatusPill(text: item.isPublished ? "Published" : "Draft",
                                  tint: item.isPublished ? .green : .secondary)
                    if busyID == item.id { ProgressView().controlSize(.mini) }
                }
            }
        }
        .contextMenu {
            NavigationLink {
                WebEditorView(path: "/admin/\(webSegment)/\(item.id)", title: item.title)
            } label: {
                Label("Open in web editor", systemImage: "globe")
            }
        }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                act(item.id) { try await client().delete("/api/experiences/\(item.id)") }
            } label: { Label("Trash", systemImage: "trash") }

            Button {
                act(item.id) {
                    try await client().patch("/api/experiences/\(item.id)",
                                             body: ["published": !item.isPublished])
                }
            } label: {
                Label(item.isPublished ? "Unpublish" : "Publish",
                      systemImage: item.isPublished ? "eye.slash" : "eye")
            }
            .tint(item.isPublished ? .gray : .green)
        }
    }

    private func client() -> APIClient { APIClient(auth: auth) }

    /// Drag-to-reorder. The new order becomes positions 1, 2, 3… and only the
    /// roles whose position actually changed are sent, one small PATCH each —
    /// the endpoint the web's quick edits use, which leaves everything else
    /// about the role alone.
    private func move(from source: IndexSet, to destination: Int) {
        var ordered = live
        ordered.move(fromOffsets: source, toOffset: destination)

        var changes: [(id: String, position: Int)] = []
        for (index, item) in ordered.enumerated() where item.sort_order != index + 1 {
            changes.append((item.id, index + 1))
        }
        guard !changes.isEmpty else { return }

        // Show the new order straight away; the server catches up behind it.
        let positions = Dictionary(uniqueKeysWithValues: changes.map { ($0.id, $0.position) })
        items = items.map { item in
            var copy = item
            if let position = positions[item.id] { copy.sort_order = position }
            return copy
        }
        items.sort { ($0.sort_order ?? 0) < ($1.sort_order ?? 0) }

        reordering = true
        error = nil
        Task {
            do {
                for change in changes {
                    try await client().patch("/api/experiences/\(change.id)", body: ["sort_order": change.position])
                }
            } catch {
                self.error = "Couldn't save the new order: \(error.localizedDescription)"
            }
            reordering = false
            await load()
        }
    }

    private func act(_ id: String, _ work: @escaping () async throws -> Void) {
        busyID = id; error = nil
        Task {
            do { try await work(); await load() }
            catch { self.error = error.localizedDescription }
            busyID = nil
        }
    }

    private func load() async {
        loading = true
        do {
            items = try await client().get(
                "/api/experiences?all=1&category=\(category)&limit=200",
                as: [ExperienceItem].self
            )
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}
