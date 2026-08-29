import SwiftUI

struct RecommendationsView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var items: [Recommendation] = []
    @State private var loading = true
    @State private var error: String?

    private var pending: [Recommendation] { items.filter { $0.state == .pending } }
    private var reviewed: [Recommendation] { items.filter { $0.state != .pending } }

    var body: some View {
        List {
            if loading {
                Section { HStack { Spacer(); ProgressView(); Spacer() } }
            } else if items.isEmpty {
                Section { ContentUnavailableView("No notes yet", systemImage: "quote.bubble") }
            } else {
                if !pending.isEmpty {
                    Section("To review (\(pending.count))") { ForEach(pending, content: card) }
                }
                if !reviewed.isEmpty {
                    Section("Reviewed") { ForEach(reviewed, content: card) }
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
            Text(item.message).font(.footnote).foregroundStyle(.secondary).lineLimit(4)

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
                ActionButton("Delete", .red) { await remove(item) }
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
