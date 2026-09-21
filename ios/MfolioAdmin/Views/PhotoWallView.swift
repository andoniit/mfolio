import SwiftUI

/// Visitor Polaroids: review what's waiting, arrange what's on the wall, and
/// look at any of them full size before deciding. Pending sorts to the top —
/// approving is the thing most worth doing from a phone.
struct PhotoWallView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var posts: [PhotoWallPost] = []
    @State private var loading = true
    @State private var error: String?
    @State private var viewing: PhotoWallPost?
    @State private var pendingDelete: PhotoWallPost?
    @State private var reordering = false

    private var pending: [PhotoWallPost] { posts.filter { $0.state == .pending } }
    /// In the wall's own order — the API's `sort_order`, then newest.
    private var live: [PhotoWallPost] { posts.filter { $0.state == .approved } }
    private var rejected: [PhotoWallPost] { posts.filter { $0.state == .rejected } }

    var body: some View {
        List {
            // Spinner on first load only; refreshes keep the list on screen.
            if loading && posts.isEmpty {
                Section { HStack { Spacer(); ProgressView(); Spacer() } }
            } else if posts.isEmpty {
                Section {
                    ContentUnavailableView("Nothing pinned yet", systemImage: "camera",
                                           description: Text("Polaroids visitors pin on the site show up here for review."))
                }
            } else {
                if !pending.isEmpty {
                    Section("To review (\(pending.count))") {
                        ForEach(pending) { post in row(post) }
                    }
                }
                if !live.isEmpty {
                    Section {
                        ForEach(live) { post in row(post) }
                            .onMove(perform: move)
                    } header: {
                        HStack {
                            Text("On the wall (\(live.count))")
                            if reordering { ProgressView().controlSize(.mini) }
                        }
                    } footer: {
                        Text("Tap a photo to see it full size. Tap Edit to drag them into the order the wall shows.")
                    }
                }
                if !rejected.isEmpty {
                    Section("Rejected (\(rejected.count))") {
                        ForEach(rejected) { post in row(post) }
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
        .toolbar { if live.count > 1 { EditButton() } }
        .refreshable { await load() }
        .task { await load() }
        .sheet(item: $viewing) { post in
            PhotoWallDetail(
                post: post,
                setStatus: { status in await set(post, status) },
                saveCaption: { caption in await saveCaption(post, caption) },
                delete: { await remove(post) }
            )
        }
        .confirmationDialog(
            "Delete this photo permanently?",
            isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } }),
            titleVisibility: .visible,
            presenting: pendingDelete
        ) { post in
            Button("Delete permanently", role: .destructive) { Task { await remove(post) } }
            if post.state != .rejected {
                Button("Reject it instead") { Task { await set(post, .rejected) } }
            }
        } message: { _ in
            Text("The uploaded image is removed too. This can't be undone.")
        }
    }

    private func row(_ post: PhotoWallPost) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Button { viewing = post } label: {
                HStack(alignment: .top, spacing: 12) {
                    Thumbnail(url: post.image_url, fallback: post.message)
                        .frame(width: 84, height: 84)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                        .overlay(alignment: .bottomTrailing) {
                            Image(systemName: "arrow.up.left.and.arrow.down.right")
                                .font(.caption2.weight(.bold))
                                .padding(4)
                                .background(.ultraThinMaterial, in: Circle())
                                .padding(4)
                        }
                    VStack(alignment: .leading, spacing: 3) {
                        Text(post.message).font(.callout).lineLimit(3).foregroundStyle(.primary)
                        Text(post.author_name ?? "Anonymous")
                            .font(.caption).foregroundStyle(.secondary)
                        StatusChip(state: post.state)
                    }
                    Spacer(minLength: 0)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

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
                ActionButton("Delete", .red) { pendingDelete = post }
            }
        }
        .padding(.vertical, 4)
    }

    // MARK: - Actions

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

    /// Returns the error to show in the detail sheet, or nil when saved.
    private func saveCaption(_ post: PhotoWallPost, _ caption: String) async -> String? {
        do {
            try await APIClient(auth: auth).patch("/api/photo-wall/\(post.id)", body: ["message": caption])
            await load()
            return nil
        } catch {
            return error.localizedDescription
        }
    }

    private func remove(_ post: PhotoWallPost) async {
        do {
            try await APIClient(auth: auth).delete("/api/photo-wall/\(post.id)")
            await load()
        } catch { self.error = error.localizedDescription }
    }

    /// Drag-to-reorder on the live wall. The new order becomes positions
    /// 1, 2, 3…, and only posts whose position changed are sent.
    private func move(from source: IndexSet, to destination: Int) {
        var ordered = live
        ordered.move(fromOffsets: source, toOffset: destination)

        var changes: [(id: String, position: Int)] = []
        for (index, post) in ordered.enumerated() where post.sort_order != index + 1 {
            changes.append((post.id, index + 1))
        }
        guard !changes.isEmpty else { return }

        // Show the new order straight away; the server catches up behind it.
        let positions = Dictionary(uniqueKeysWithValues: changes.map { ($0.id, $0.position) })
        let others = posts.filter { $0.state != .approved }
        posts = ordered.map { post in
            var copy = post
            if let position = positions[post.id] { copy.sort_order = position }
            return copy
        } + others

        reordering = true
        error = nil
        Task {
            do {
                for change in changes {
                    try await APIClient(auth: auth)
                        .patch("/api/photo-wall/\(change.id)", body: ["sort_order": change.position])
                }
            } catch {
                self.error = "Couldn't save the new order: \(error.localizedDescription)"
            }
            reordering = false
            await load()
        }
    }
}

/// One Polaroid, full size: the photo as the visitor sent it, who sent it and
/// when, the caption (editable — a typo shouldn't mean rejecting it), and the
/// same actions as the list.
private struct PhotoWallDetail: View {
    let post: PhotoWallPost
    let setStatus: (ModerationStatus) async -> Void
    let saveCaption: (String) async -> String?
    let delete: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var caption: String
    /// What the server has now — the post passed in goes stale after a save.
    @State private var savedCaption: String
    @State private var savingCaption = false
    @State private var captionError: String?
    /// Asked here rather than by the list: presenting a dialog while this
    /// sheet is still closing is refused by iOS, and the delete would vanish.
    @State private var confirmDelete = false

    /// The API's limit (`MESSAGE_MAX` in photo-wall.ts).
    private static let captionMax = 140

    init(post: PhotoWallPost,
         setStatus: @escaping (ModerationStatus) async -> Void,
         saveCaption: @escaping (String) async -> String?,
         delete: @escaping () async -> Void) {
        self.post = post
        self.setStatus = setStatus
        self.saveCaption = saveCaption
        self.delete = delete
        _caption = State(initialValue: post.message)
        _savedCaption = State(initialValue: post.message)
    }

    private var trimmed: String { caption.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var captionChanged: Bool { trimmed != savedCaption }
    private var captionValid: Bool { !trimmed.isEmpty && trimmed.count <= Self.captionMax }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    AsyncImage(url: URL(string: post.image_url)) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().aspectRatio(contentMode: .fit)
                        case .failure:
                            Label("Couldn't load the photo", systemImage: "photo")
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, minHeight: 200)
                        default:
                            ProgressView().frame(maxWidth: .infinity, minHeight: 260)
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: Theme.tileCorner, style: .continuous))
                    .listRowInsets(EdgeInsets(top: 12, leading: 12, bottom: 12, trailing: 12))
                } footer: {
                    HStack(spacing: 6) {
                        StatusChip(state: post.state)
                        Text(post.author_name ?? "Anonymous")
                        if let when = post.submittedLine { Text("· \(when)") }
                    }
                }

                Section {
                    TextField("Caption", text: $caption, axis: .vertical)
                        .lineLimit(2...5)
                    if captionChanged {
                        Button {
                            Task {
                                savingCaption = true
                                let value = trimmed
                                captionError = await saveCaption(value)
                                if captionError == nil {
                                    savedCaption = value
                                    caption = value
                                }
                                savingCaption = false
                            }
                        } label: {
                            HStack {
                                Text("Save caption")
                                Spacer()
                                if savingCaption { ProgressView() }
                            }
                        }
                        .disabled(!captionValid || savingCaption)
                    }
                } header: {
                    Text("Caption")
                } footer: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(trimmed.count)/\(Self.captionMax)")
                            .foregroundStyle(trimmed.count > Self.captionMax ? .red : .secondary)
                        if let captionError { Text(captionError).foregroundStyle(.red) }
                    }
                }

                Section {
                    if post.state != .approved {
                        action("Approve — put it on the wall", "checkmark.circle.fill", .green) { await setStatus(.approved) }
                    }
                    if post.state == .approved {
                        action("Unpublish — back to review", "eye.slash", .gray) { await setStatus(.pending) }
                    }
                    if post.state != .rejected {
                        action("Reject", "xmark.circle", .orange) { await setStatus(.rejected) }
                    }
                    Button(role: .destructive) { confirmDelete = true } label: {
                        Label("Delete permanently…", systemImage: "trash")
                    }
                    .tint(.red) // or the icon stays accent-blue beside red text
                }
            }
            .navigationTitle("Polaroid")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
            .confirmationDialog("Delete this photo permanently?", isPresented: $confirmDelete,
                                titleVisibility: .visible) {
                Button("Delete permanently", role: .destructive) {
                    Task {
                        await delete()
                        dismiss()
                    }
                }
                if post.state != .rejected {
                    Button("Reject it instead") {
                        Task {
                            await setStatus(.rejected)
                            dismiss()
                        }
                    }
                }
            } message: {
                Text("The uploaded image is removed too. This can't be undone.")
            }
        }
    }

    private func action(_ title: String, _ icon: String, _ tint: Color,
                        run: @escaping () async -> Void) -> some View {
        Button {
            Task {
                await run()
                dismiss()
            }
        } label: {
            Label(title, systemImage: icon).foregroundStyle(tint)
        }
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
