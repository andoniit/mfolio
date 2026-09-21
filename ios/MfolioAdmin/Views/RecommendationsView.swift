import SwiftUI

/// Visitors' sticky notes: review what's waiting and manage what's live.
/// Deleting is permanent, so it always asks first — rejecting is the undoable
/// way to take a note down.
struct RecommendationsView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var items: [Recommendation] = []
    @State private var loading = true
    @State private var error: String?
    @State private var pendingDelete: Recommendation?
    /// Notes are clipped to four lines; tapping one shows it whole, since it's
    /// worth reading all of it before it goes on the site.
    @State private var expanded: Set<String> = []

    private var pending: [Recommendation] { items.filter { $0.state == .pending } }
    private var live: [Recommendation] { items.filter { $0.state == .approved } }
    private var rejected: [Recommendation] { items.filter { $0.state == .rejected } }

    var body: some View {
        List {
            // Spinner on first load only; refreshes keep the list on screen.
            if loading && items.isEmpty {
                Section { HStack { Spacer(); ProgressView(); Spacer() } }
            } else if items.isEmpty {
                Section { ContentUnavailableView("No notes yet", systemImage: "quote.bubble") }
            } else {
                if !pending.isEmpty {
                    Section("To review (\(pending.count))") { ForEach(pending, content: card) }
                }
                if !live.isEmpty {
                    Section("On the site (\(live.count))") { ForEach(live, content: card) }
                }
                if !rejected.isEmpty {
                    Section("Rejected (\(rejected.count))") { ForEach(rejected, content: card) }
                }
            }

            if let error {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle.fill")
                        .font(.footnote).foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("Recommendations")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await load() }
        .task { await load() }
        .confirmationDialog(
            "Delete the note from \(pendingDelete?.name ?? "this visitor") permanently?",
            isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } }),
            titleVisibility: .visible,
            presenting: pendingDelete
        ) { item in
            Button("Delete permanently", role: .destructive) { Task { await remove(item) } }
            if item.state != .rejected {
                Button("Reject it instead") { Task { await set(item, .rejected) } }
            }
        } message: { _ in
            Text("This can't be undone.")
        }
    }

    @ViewBuilder
    private func card(_ item: Recommendation) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                Thumbnail(url: item.avatar_url, fallback: item.name)
                    .frame(width: 36, height: 36)
                    .clipShape(Circle())
                VStack(alignment: .leading, spacing: 1) {
                    Text(item.name).font(.callout.weight(.semibold))
                    if let role = item.role, !role.isEmpty {
                        Text(role).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                    }
                }
                Spacer()
                StatusChip(state: item.state)
            }
            Text(item.message)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineLimit(expanded.contains(item.id) ? nil : 4)
                .contentShape(Rectangle())
                .onTapGesture {
                    if expanded.contains(item.id) { expanded.remove(item.id) } else { expanded.insert(item.id) }
                }

            HStack(spacing: 8) {
                if item.state != .approved {
                    ActionButton("Approve", .green) { await set(item, .approved) }
                }
                if item.state == .approved {
                    ActionButton("Unpublish", .gray) { await set(item, .pending) }
                }
                if item.state != .rejected {
                    ActionButton("Reject", .orange) { await set(item, .rejected) }
                }
                ActionButton("Delete", .red) { pendingDelete = item }
            }
        }
        .padding(.vertical, 4)
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do {
            error = nil
            items = try await APIClient(auth: auth).get("/api/recommendations?status=all", as: [Recommendation].self)
        } catch { self.error = error.localizedDescription }
    }

    private func set(_ item: Recommendation, _ status: ModerationStatus) async {
        do {
            try await APIClient(auth: auth).patch("/api/recommendations/\(item.id)", body: ["status": status.rawValue])
            await load()
        } catch { self.error = error.localizedDescription }
    }

    private func remove(_ item: Recommendation) async {
        do {
            try await APIClient(auth: auth).delete("/api/recommendations/\(item.id)")
            await load()
        } catch { self.error = error.localizedDescription }
    }
}
