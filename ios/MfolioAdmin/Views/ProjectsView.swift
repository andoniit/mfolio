import SwiftUI

/// Projects: write, edit, publish, unpublish, trash and restore — all
/// natively, gallery and tech stack included. The web editor is a long-press
/// away as a fallback.
struct ProjectsView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var projects: [ProjectSummary] = []
    @State private var loading = true
    @State private var busyID: String?
    @State private var error: String?

    private var live: [ProjectSummary] { projects.filter { !$0.isTrashed } }
    private var trashed: [ProjectSummary] { projects.filter(\.isTrashed) }

    /// Who holds each home-page slot, leaving out the project being edited —
    /// the editor uses it to say what picking a slot will displace.
    private func slotOwners(excluding id: String?) -> [Int: String] {
        var owners: [Int: String] = [:]
        for project in live where project.id != id {
            if let slot = project.home_feature_order { owners[slot] = project.title }
        }
        return owners
    }

    var body: some View {
        List {
            if let error {
                Section { ErrorCard(message: error) { Task { await load() } } }
            }

            Section {
                NavigationLink {
                    ProjectEditorView(projectID: nil, homeSlotOwners: slotOwners(excluding: nil)) {
                        Task { await load() }
                    }
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
                    Text("Tap to edit. Swipe to publish or trash. Long-press for the site or the web editor.")
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
            ProjectEditorView(projectID: project.id, homeSlotOwners: slotOwners(excluding: project.id)) {
                Task { await load() }
            }
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
                        if let slot = project.home_feature_order {
                            StatusPill(text: "Home #\(slot)", tint: Theme.Accent.projects)
                        }
                        if busyID == project.id { ProgressView().controlSize(.mini) }
                    }
                }
            }
            .padding(.vertical, 2)
        }
        .contextMenu {
            if project.isPublished, let slug = project.slug,
               let url = URL(string: "\(AppConfig.siteURL)/projects/\(slug)") {
                Link(destination: url) { Label("View on site", systemImage: "safari") }
            }
            NavigationLink {
                WebEditorView(path: "/admin/projects/\(project.id)", title: project.title)
            } label: {
                Label("Open in web editor", systemImage: "globe")
            }
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
