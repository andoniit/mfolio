import SwiftUI

/// Work history and voluntary roles — the same `experiences` table split by
/// `category`, so one screen serves both entries on the dashboard.
struct ExperienceView: View {
    let category: String       // "work" or "volunteer"
    let title: String

    @EnvironmentObject private var auth: AuthStore
    @State private var items: [ExperienceItem] = []
    @State private var loading = true
    @State private var busyID: String?
    @State private var error: String?

    private var live: [ExperienceItem] { items.filter { !$0.isTrashed } }
    private var trashed: [ExperienceItem] { items.filter(\.isTrashed) }

    var body: some View {
        List {
            if let error {
                Section { ErrorCard(message: error) { Task { await load() } } }
            }

            Section {
                NavigationLink {
                    WebEditorView(path: "/admin/\(webSegment)/new", title: "New")
                } label: {
                    Label("Add \(title.lowercased())", systemImage: "plus")
                }
            }

            if live.isEmpty && !loading {
                Section { ContentUnavailableView("Nothing yet", systemImage: "briefcase") }
            } else {
                Section("\(title) (\(live.count))") {
                    ForEach(live) { item in row(item) }
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
        .overlay { if loading && items.isEmpty { ProgressView() } }
        .refreshable { await load() }
        .task { await load() }
    }

    private var webSegment: String { category == "volunteer" ? "volunteer" : "experience" }

    private func row(_ item: ExperienceItem) -> some View {
        NavigationLink {
            WebEditorView(path: "/admin/\(webSegment)/\(item.id)", title: item.title)
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
