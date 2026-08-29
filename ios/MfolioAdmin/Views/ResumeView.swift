import SwiftUI
import QuickLook

/// The downloadable resume: see what's live, preview it, or remove it.
/// Replacing the file means picking a PDF, which the web dashboard already
/// does well — so that stays there rather than being half-rebuilt here.
struct ResumeView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var info: ResumeInfo?
    @State private var loading = true
    @State private var busy = false
    @State private var error: String?
    @State private var previewURL: URL?

    var body: some View {
        List {
            if let error {
                Section { ErrorCard(message: error) { Task { await load() } } }
            }

            Section("Current resume") {
                if loading {
                    HStack { ProgressView(); Text("Checking…").foregroundStyle(.secondary) }
                } else if let url = info?.url, let link = URL(string: url) {
                    Label("A resume is live", systemImage: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                    Button {
                        previewURL = link
                    } label: {
                        Label("Preview", systemImage: "doc.text.magnifyingglass")
                    }
                    Link(destination: link) {
                        Label("Open in browser", systemImage: "safari")
                    }
                    Button(role: .destructive) {
                        remove()
                    } label: {
                        Label("Remove resume", systemImage: "trash")
                    }
                    .disabled(busy)
                } else {
                    Label("No resume uploaded", systemImage: "exclamationmark.triangle")
                        .foregroundStyle(.secondary)
                }
            }

            Section {
                NavigationLink {
                    WebEditorView(path: "/admin/resume", title: "Resume")
                } label: {
                    Label("Upload a new one", systemImage: "square.and.arrow.up")
                }
            } footer: {
                Text("Uploading opens the web dashboard, which handles the PDF picker.")
            }
        }
        .navigationTitle("Resume")
        .navigationBarTitleDisplayMode(.inline)
        .quickLookPreview($previewURL)
        .refreshable { await load() }
        .task { await load() }
    }

    private func remove() {
        busy = true; error = nil
        Task {
            do {
                try await APIClient(auth: auth).delete("/api/resume")
                await load()
            } catch { self.error = error.localizedDescription }
            busy = false
        }
    }

    private func load() async {
        loading = true
        do {
            info = try await APIClient(auth: auth).get("/api/resume", as: ResumeInfo.self)
            error = nil
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}
