import SwiftUI

/// Type a game, tap a result, and the title, platform and cover art fill in.
///
/// The lookup goes through the site's own `/api/games/search` rather than
/// hitting a game database directly, so the RAWG key stays on the server and
/// never ships inside the app.
struct GameSearchSection: View {
    let onPick: (GameHit) -> Void

    @EnvironmentObject private var auth: AuthStore
    @State private var term = ""
    @State private var hits: [GameHit] = []
    @State private var note: String?
    @State private var searching = false
    @State private var searched = false
    @State private var task: Task<Void, Never>?

    var body: some View {
        Section {
            HStack {
                Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                TextField("Search a game…", text: $term)
                    .autocorrectionDisabled()
                    .onChange(of: term) { _, value in schedule(value) }
                if searching { ProgressView().controlSize(.small) }
                else if !term.isEmpty {
                    Button {
                        term = ""; hits = []; note = nil; searched = false
                    } label: {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(.tertiary)
                    }
                    .buttonStyle(.plain)
                }
            }

            ForEach(hits) { hit in
                Button {
                    onPick(hit)
                    term = ""; hits = []; note = nil; searched = false
                } label: {
                    HStack(spacing: 10) {
                        Thumbnail(url: hit.image, fallback: hit.name)
                            .frame(width: 40, height: 54)
                            .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(hit.name).font(.subheadline).foregroundStyle(.primary).lineLimit(2)
                            if !hit.detail.isEmpty {
                                Text(hit.detail).font(.caption2).foregroundStyle(.secondary).lineLimit(1)
                            }
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "arrow.down.left.circle").foregroundStyle(.tint)
                    }
                }
            }

            if searched && !searching && hits.isEmpty && term.trimmingCharacters(in: .whitespaces).count >= 2 {
                Text("Nothing found — fill the fields in by hand.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        } header: {
            Text("Find the game")
        } footer: {
            if let note {
                Text(note)
            } else {
                Text("Picking a result fills in the title, platform and cover art.")
            }
        }
    }

    /// Debounced: a fast typist shouldn't fire a request per keystroke.
    private func schedule(_ value: String) {
        task?.cancel()
        let q = value.trimmingCharacters(in: .whitespaces)
        guard q.count >= 2 else {
            hits = []; note = nil; searched = false; searching = false
            return
        }
        task = Task {
            try? await Task.sleep(for: .milliseconds(350))
            guard !Task.isCancelled else { return }
            await run(q)
        }
    }

    private func run(_ query: String) async {
        searching = true
        defer { searching = false }
        do {
            let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
            let response: GameSearchResponse = try await APIClient(auth: auth)
                .get("/api/games/search?q=\(encoded)", as: GameSearchResponse.self)
            guard !Task.isCancelled else { return }
            hits = response.results
            note = response.note
            searched = true
        } catch {
            hits = []
            note = error.localizedDescription
            searched = true
        }
    }
}
