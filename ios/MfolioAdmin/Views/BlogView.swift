import SwiftUI

/// Blog posts: publish, unpublish, trash and restore from the phone. Writing
/// the body stays in the web editor, which opens already signed in.
struct BlogView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var posts: [BlogPost] = []
    @State private var loading = true
    @State private var busyID: String?
    @State private var error: String?

    private var live: [BlogPost] { posts.filter { !$0.isTrashed } }
    private var trashed: [BlogPost] { posts.filter(\.isTrashed) }

    var body: some View {
        List {
            if let error {
                Section { ErrorCard(message: error) { Task { await load() } } }
            }

            Section {
                NavigationLink {
                    WebEditorView(path: "/admin/blogs/new", title: "New Post")
                } label: {
                    Label("New post", systemImage: "square.and.pencil")
                }
            }

            if live.isEmpty && !loading {
                Section { ContentUnavailableView("No posts", systemImage: "doc.text") }
            } else {
                Section("Posts (\(live.count))") {
                    ForEach(live) { post in row(post) }
                }
            }

            if !trashed.isEmpty {
                Section("Trash (\(trashed.count))") {
                    ForEach(trashed) { post in trashedRow(post) }
                }
            }
        }
        .navigationTitle("Blog")
        .navigationBarTitleDisplayMode(.inline)
        .overlay { if loading && posts.isEmpty { ProgressView() } }
        .refreshable { await load() }
        .task { await load() }
    }

    private func row(_ post: BlogPost) -> some View {
        NavigationLink {
            WebEditorView(path: "/admin/blogs/\(post.id)", title: post.title)
        } label: {
            VStack(alignment: .leading, spacing: 4) {
                Text(post.title).font(.body)
                HStack(spacing: 6) {
                    StatusPill(text: post.isPublished ? "Published" : "Draft",
                                  tint: post.isPublished ? .green : .secondary)
                    if busyID == post.id { ProgressView().controlSize(.mini) }
                }
            }
        }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                act(post.id) { try await client().delete("/api/posts/\(post.id)") }
            } label: { Label("Trash", systemImage: "trash") }

            Button {
                act(post.id) {
                    try await client().patch("/api/posts/\(post.id)", body: ["published": !post.isPublished])
                }
            } label: {
                Label(post.isPublished ? "Unpublish" : "Publish",
                      systemImage: post.isPublished ? "eye.slash" : "eye")
            }
            .tint(post.isPublished ? .gray : .green)
        }
    }

    private func trashedRow(_ post: BlogPost) -> some View {
        HStack {
            Text(post.title).foregroundStyle(.secondary)
            Spacer()
            if busyID == post.id { ProgressView().controlSize(.mini) }
            Button("Restore") {
                act(post.id) { try await client().post("/api/posts/\(post.id)/restore", body: [:]) }
            }
            .buttonStyle(.bordered)
            .controlSize(.small)
        }
    }

    private func client() -> APIClient { APIClient(auth: auth) }

    private func act(_ id: String, _ work: @escaping () async throws -> Void) {
        busyID = id
        error = nil
        Task {
            do { try await work(); await load() }
            catch { self.error = error.localizedDescription }
            busyID = nil
        }
    }

    private func load() async {
        loading = true
        do {
            // `all=1` is what makes drafts and trashed posts visible.
            posts = try await client().get("/api/posts?all=1", as: [BlogPost].self)
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}
