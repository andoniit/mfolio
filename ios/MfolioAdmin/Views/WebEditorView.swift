import SwiftUI
@preconcurrency import WebKit

/// The web dashboard inside the app, for the parts not worth rebuilding
/// natively (the TipTap post editor above all).
///
/// `/admin` is gated client-side by reading the Supabase session out of
/// `localStorage`, so the app writes its own session there before the page
/// loads — otherwise the web view would bounce straight to the login screen.
struct WebEditorView: View {
    let path: String
    let title: String

    @EnvironmentObject private var auth: AuthStore
    @State private var seed: (key: String, value: String)?
    @State private var loading = true
    @State private var failure: String?

    private var target: URL? {
        AppConfig.siteURL.isEmpty ? nil : URL(string: AppConfig.siteURL + path)
    }

    var body: some View {
        Group {
            if let failure {
                ContentUnavailableView("Couldn't open", systemImage: "exclamationmark.triangle",
                                       description: Text(failure))
            } else if let target, let seed {
                WebView(url: target, seed: seed, loading: $loading)
                    .overlay { if loading { ProgressView().controlSize(.large) } }
            } else {
                ProgressView().controlSize(.large)
            }
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .ignoresSafeArea(edges: .bottom)
        .task {
            guard target != nil else {
                failure = "Add your site URL in server settings."
                return
            }
            do { seed = try await auth.webSession() }
            catch { failure = error.localizedDescription }
        }
    }
}

private struct WebView: UIViewRepresentable {
    let url: URL
    let seed: (key: String, value: String)
    @Binding var loading: Bool

    func makeCoordinator() -> Coordinator { Coordinator(loading: $loading) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()

        // Runs before the page's own scripts, so the admin shell finds a session
        // on its first check rather than redirecting to /admin/login.
        let js = """
        (function () {
          try {
            window.localStorage.setItem(\(jsString(seed.key)), \(jsString(seed.value)));
          } catch (e) {}
        })();
        """
        config.userContentController.addUserScript(
            WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )

        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        view.allowsBackForwardNavigationGestures = true
        view.load(URLRequest(url: url))
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    /// JSON-encodes a string so quotes and newlines inside the token cannot
    /// break out of the injected literal.
    private func jsString(_ value: String) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: [value]),
              let array = String(data: data, encoding: .utf8)
        else { return "\"\"" }
        return String(array.dropFirst().dropLast()) // strip the [ ]
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        @Binding var loading: Bool
        init(loading: Binding<Bool>) { _loading = loading }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { loading = false }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { loading = false }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { loading = false }
    }
}
