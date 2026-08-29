import SwiftUI

/// Projects: publish, unpublish, trash and restore. The full editor (gallery,
/// tech stack, rich body) stays on the web, which each row links into.
struct ProjectsView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var projects: [ProjectSummary] = []
    @State private var loading = true
    @State private var busyID: String?
    @State private var error: String?

    private var live: [ProjectSummary] { projects.filter { !$0.isTrashed } }
    private var trashed: [ProjectSummary] { projects.filter(\.isTrashed) }

    var body: some View {
        List {
            if let error {
                Section { ErrorCard(message: error) { Task { await load() } } }
            }

            Section {
                NavigationLink {
                    WebEditorView(path: "/admin/projects/new", title: "New project")
                } label: {
                    Label("New project", systemImage: "plus")
                }
            }

            if live.isEmpty && !loading {
                Section { ContentUnavailableView("No projects", systemImage: "folder") }
            } else {
                Section {
                    ForEach(live) { project in row(project) }
                } header: {
                    Text("Projects (\(live.count))")
                } footer: {
                    Text("Swipe to publish or trash. Tap to open the full editor.")
                }
            }

            if !trashed.isEmpty {
                Section("Trash (\(trashed.count))") {
                    ForEach(trashed) { project in
                        HStack {
                            Text(project.title).foregroundStyle(.secondary).lineLimit(1)
                            Spacer()
                            if busyID == project.id { ProgressView().controlSize(.mini) }
                            Button("Restore") {
                                act(project.id) {
                                    try await client().post("/api/projects/\(project.id)/restore", body: [:])
                                }
                            }
                            .buttonStyle(.bordered).controlSize(.small)
                        }
                    }
                }
            }
        }
        .navigationTitle("Projects")
        .navigationBarTitleDisplayMode(.inline)
        .overlay { if loading && projects.isEmpty { ProgressView() } }
        .refreshable { await load() }
        .task { await load() }
    }

    private func row(_ project: ProjectSummary) -> some View {
        NavigationLink {
            WebEditorView(path: "/admin/projects/\(project.id)", title: project.title)
        } label: {
            HStack(spacing: 12) {
                Thumbnail(url: project.cover_image_url, fallback: project.title)
                    .frame(width: 46, height: 46)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                VStack(alignment: .leading, spacing: 3) {
                    Text(project.title).lineLimit(1)
                    HStack(spacing: 6) {
                        if let w = project.workplace, !w.isEmpty {
                            Text(w).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                        }
                        StatusPill(text: project.isPublished ? "Published" : "Draft",
                                  tint: project.isPublished ? .green : .secondary)
                        if busyID == project.id { ProgressView().controlSize(.mini) }
                    }
                }
            }
            .padding(.vertical, 2)
        }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                act(project.id) { try await client().delete("/api/projects/\(project.id)") }
            } label: { Label("Trash", systemImage: "trash") }

            Button {
                act(project.id) {
                    try await client().patch("/api/projects/\(project.id)",
                                             body: ["published": !project.isPublished])
                }
            } label: {
                Label(project.isPublished ? "Unpublish" : "Publish",
                      systemImage: project.isPublished ? "eye.slash" : "eye")
            }
            .tint(project.isPublished ? .gray : .green)
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
            error = nil
            projects = try await client()
                .get("/api/projects?all=1&limit=200", as: [ProjectSummary].self)
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}
