import SwiftUI

/// Newsletter signups. Read-only: subscribing and unsubscribing are the
/// visitor's to do, and the app has no business editing either.
struct NewsletterView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var subscribers: [Subscriber] = []
    @State private var loading = true
    @State private var error: String?

    private var active: [Subscriber] { subscribers.filter(\.isActive) }
    private var inactive: [Subscriber] { subscribers.filter { !$0.isActive } }

    var body: some View {
        List {
            if let error {
                Section { ErrorCard(message: error) { Task { await load() } } }
            }

            if subscribers.isEmpty && !loading {
                Section { ContentUnavailableView("No subscribers yet", systemImage: "envelope") }
            }

            if !active.isEmpty {
                Section("Active (\(active.count))") {
                    ForEach(active) { row($0) }
                }
            }
            if !inactive.isEmpty {
                Section("Unsubscribed (\(inactive.count))") {
                    ForEach(inactive) { row($0) }
                }
            }
        }
        .navigationTitle("Newsletter")
        .navigationBarTitleDisplayMode(.inline)
        .overlay { if loading && subscribers.isEmpty { ProgressView() } }
        .refreshable { await load() }
        .task { await load() }
    }

    private func row(_ s: Subscriber) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(s.email).font(.body)
            HStack(spacing: 6) {
                if let name = s.name, !name.isEmpty {
                    Text(name).font(.caption).foregroundStyle(.secondary)
                }
                if let source = s.source, !source.isEmpty {
                    Text(source).font(.caption2).foregroundStyle(.tertiary)
                }
            }
        }
        .textSelection(.enabled)
    }

    private func load() async {
        loading = true
        do {
            subscribers = try await APIClient(auth: auth)
                .get("/api/newsletter/subscribers", as: [Subscriber].self)
            error = nil
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}
