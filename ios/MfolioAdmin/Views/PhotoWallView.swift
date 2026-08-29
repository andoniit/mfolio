import SwiftUI

/// Visitor Polaroids awaiting review. Approving here is the single thing most
/// worth doing from a phone, so pending items sort to the top.
struct PhotoWallView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var posts: [PhotoWallPost] = []
    @State private var loading = true
    @State private var error: String?

    private var pending: [PhotoWallPost] { posts.filter { $0.state == .pending } }
    private var reviewed: [PhotoWallPost] { posts.filter { $0.state != .pending } }

    var body: some View {
        List {
            if loading {
                Section { HStack { Spacer(); ProgressView(); Spacer() } }
            } else if posts.isEmpty {
                Section {
                    ContentUnavailableView("Nothing pinned yet", systemImage: "camera")
                }
            } else {
                if !pending.isEmpty {
                    Section("To review (\(pending.count))") {
                        ForEach(pending) { post in card(post) }
                    }
                }
                if !reviewed.isEmpty {
                    Section("Reviewed") {
                        ForEach(reviewed) { post in card(post) }
                    }
                }
            }

            if let error {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle.fill")
                        .font(.footnote).foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("Photo Wall")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await load() }
        .task { await load() }
    }

    @ViewBuilder
    private func card(_ post: PhotoWallPost) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                Thumbnail(url: post.image_url, fallback: post.message)
                    .frame(width: 72, height: 72)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                VStack(alignment: .leading, spacing: 3) {
                    Text(post.message).font(.callout).lineLimit(3)
                    Text(post.author_name ?? "Anonymous")
                        .font(.caption).foregroundStyle(.secondary)
                    StatusChip(state: post.state)
                }
                Spacer(minLength: 0)
            }

            HStack(spacing: 8) {
                if post.state != .approved {
                    ActionButton("Approve", .green) { await set(post, .approved) }
                }
                if post.state == .approved {
                    ActionButton("Unpublish", .gray) { await set(post, .pending) }
                }
                if post.state != .rejected {
                    ActionButton("Reject", .orange) { await set(post, .rejected) }
                }
                ActionButton("Delete", .red) { await remove(post) }
            }
        }
        .padding(.vertical, 4)
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do {
            error = nil
            posts = try await APIClient(auth: auth).get("/api/photo-wall?status=all", as: [PhotoWallPost].self)
        } catch { self.error = error.localizedDescription }
    }

    private func set(_ post: PhotoWallPost, _ status: ModerationStatus) async {
        do {
            try await APIClient(auth: auth).patch("/api/photo-wall/\(post.id)", body: ["status": status.rawValue])
            await load()
        } catch { self.error = error.localizedDescription }
    }

    private func remove(_ post: PhotoWallPost) async {
        do {
            try await APIClient(auth: auth).delete("/api/photo-wall/\(post.id)")
            await load()
        } catch { self.error = error.localizedDescription }
    }
}

struct StatusChip: View {
    let state: ModerationStatus

    private var tint: Color {
        switch state {
        case .pending: return .orange
        case .approved: return .green
        case .rejected: return .red
        }
    }

    var body: some View {
        Text(state.rawValue.capitalized)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(tint)
            .padding(.horizontal, 7).padding(.vertical, 2)
            .background(tint.opacity(0.14), in: Capsule())
    }
}

/// Small async button that disables itself while its work runs.
struct ActionButton: View {
    let title: String
    let tint: Color
    let action: () async -> Void
    @State private var busy = false

    init(_ title: String, _ tint: Color, action: @escaping () async -> Void) {
        self.title = title
        self.tint = tint
        self.action = action
    }

    var body: some View {
        Button {
            Task { busy = true; await action(); busy = false }
        } label: {
            Text(title).font(.caption.weight(.semibold))
        }
        .buttonStyle(.bordered)
        .tint(tint)
        .controlSize(.small)
        .disabled(busy)
    }
}
