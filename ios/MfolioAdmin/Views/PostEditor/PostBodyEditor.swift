import ObjectiveC
import SwiftUI
@preconcurrency import WebKit

/// What the native format bar needs to know about the cursor, as reported by
/// `editor.js` once per frame.
struct EditorFormatState: Decodable, Equatable {
    var bold = false, italic = false, underline = false, strike = false
    var code = false, highlight = false, `subscript` = false, superscript = false
    var link = false
    var linkHref = ""
    /// 0 for body text, otherwise the heading level.
    var heading = 0
    var bulletList = false, orderedList = false, taskList = false
    var blockquote = false, codeBlock = false
    var align = "left"
    var canUndo = false, canRedo = false
    var hasSelection = false
    var words = 0
    var focused = false

    var inList: Bool { bulletList || orderedList || taskList }
}

/// The body at the moment of saving.
struct EditorSnapshot {
    let json: JSONValue
    let html: String
    let isEmpty: Bool
    let words: Int
}

/// Owns the post body: a TipTap editor bundled in the app (`Editor/`),
/// rendered in a web view and driven entirely from Swift.
///
/// Why not a UITextView: posts are TipTap documents, and the web dashboard
/// edits the same ones. Rebuilding that schema natively means translating
/// every save through a lossy converter; running the same engine means a post
/// written here opens on the web unchanged. Everything around the text —
/// toolbar, image picking and upload, links, metadata — is native.
///
/// Nothing is loaded from the site. The page is a file in the app bundle, its
/// CSP forbids network access, and navigation away from it is refused.
@MainActor
final class PostBodyEditor: NSObject, ObservableObject {
    @Published private(set) var state = EditorFormatState()
    @Published private(set) var isReady = false
    /// The body differs from what was last loaded or saved.
    @Published private(set) var isDirty = false
    /// Bumps on every edit, so the screen can debounce its draft autosave.
    @Published private(set) var revision = 0
    @Published private(set) var failure: String?

    private(set) lazy var webView: WKWebView = makeWebView()

    /// Content handed over before the page finished loading.
    private var pending: Any?
    private var hasPending = false

    // MARK: - Commands

    /// Loads a document. `content` is TipTap JSON, HTML, or nil for empty.
    /// Not an edit: the body is clean afterwards.
    func load(_ content: Any?) {
        isDirty = false
        guard isReady else {
            pending = content
            hasPending = true
            return
        }
        call("mfolio.setContent(content)", ["content": content ?? NSNull()])
    }

    func exec(_ command: String, _ argument: Any? = nil) {
        call("return mfolio.exec(name, arg)", ["name": command, "arg": argument ?? NSNull()])
    }

    func setLink(_ href: String, text: String?) {
        call("return mfolio.setLink(href, text)", ["href": href, "text": text ?? NSNull()])
    }

    func insertImage(url: String, alt: String?) {
        call("return mfolio.insertImage(src, alt)", ["src": url, "alt": alt ?? NSNull()])
    }

    func focus() { call("mfolio.focus()") }

    func dismissKeyboard() {
        call("mfolio.blur()")
        webView.endEditing(true)
    }

    /// Saved successfully: what is in the editor is now what's on the server.
    func markClean() { isDirty = false }

    func snapshot() async throws -> EditorSnapshot {
        guard isReady else {
            throw APIError(status: -1, message: "The editor hasn't finished loading.")
        }
        let raw = try await webView.callAsyncJavaScript(
            "return mfolio.snapshot()", arguments: [:], in: nil, contentWorld: .page
        )
        guard let string = raw as? String,
              let data = string.data(using: .utf8),
              let object = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let json = object["json"],
              let html = object["html"] as? String
        else {
            throw APIError(status: -1, message: "Couldn't read the post body from the editor.")
        }
        return EditorSnapshot(
            json: JSONValue(foundation: json),
            html: html,
            isEmpty: (object["isEmpty"] as? Bool) ?? html.isEmpty,
            words: (object["words"] as? Int) ?? 0
        )
    }

    /// Fire-and-forget: formatting commands have nothing to return that the
    /// next `state` message won't already say.
    private func call(_ body: String, _ arguments: [String: Any] = [:]) {
        guard isReady else { return }
        webView.callAsyncJavaScript(body, arguments: arguments, in: nil, in: .page) { result in
            if case .failure(let error) = result {
                print("[editor] \(body): \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Web view

    private func makeWebView() -> WKWebView {
        let config = WKWebViewConfiguration()
        // A throwaway store: the editor has no cookies or storage worth keeping,
        // and must not share the signed-in web dashboard's.
        config.websiteDataStore = .nonPersistent()
        config.userContentController.add(WeakScriptHandler(self), name: "mfolio")
        config.dataDetectorTypes = []

        let view = WKWebView(frame: .zero, configuration: config)
        view.isOpaque = false
        view.backgroundColor = .clear
        view.scrollView.backgroundColor = .clear
        view.scrollView.keyboardDismissMode = .interactive
        // SwiftUI already lays this view out inside the safe area. Left on
        // automatic, WebKit adds its own safe-area inset on top and shifts the
        // content whenever the frame moves — a banner above collapsing was
        // enough to hide the first line under the divider.
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.navigationDelegate = self
        view.allowsLinkPreview = false
        Self.hideInputAccessory(in: view)

        guard let page = Bundle.main.url(forResource: "editor", withExtension: "html", subdirectory: "Editor") else {
            failure = "The editor is missing from this build."
            return view
        }
        view.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
        return view
    }

    /// WebKit puts its own ‹ › Done bar above the keyboard for editable
    /// content. The native format bar replaces it, and two stacked bars eat a
    /// third of the screen, so the content view gets a subclass whose
    /// `inputAccessoryView` is nil. Public runtime API only; if WebKit ever
    /// renames the view, this quietly does nothing and the stock bar returns.
    private static func hideInputAccessory(in webView: WKWebView) {
        guard let content = webView.scrollView.subviews.first(where: {
            NSStringFromClass(type(of: $0)).hasPrefix("WKContent")
        }) else { return }

        let base: AnyClass = type(of: content)
        let baseName = NSStringFromClass(base)
        guard !baseName.hasSuffix("_MfolioNoAccessory") else { return }
        let name = baseName + "_MfolioNoAccessory"

        var subclass: AnyClass? = NSClassFromString(name)
        if subclass == nil, let made = objc_allocateClassPair(base, name, 0) {
            let getter: @convention(block) (AnyObject) -> AnyObject? = { _ in nil }
            class_addMethod(
                made,
                #selector(getter: UIResponder.inputAccessoryView),
                imp_implementationWithBlock(getter),
                "@@:"
            )
            objc_registerClassPair(made)
            subclass = made
        }
        if let subclass { object_setClass(content, subclass) }
    }

    fileprivate func receive(_ message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "ready":
            isReady = true
            if hasPending {
                hasPending = false
                let content = pending
                pending = nil
                load(content)
            }
        case "state":
            guard let raw = body["state"],
                  let data = try? JSONSerialization.data(withJSONObject: raw),
                  let decoded = try? JSONDecoder().decode(EditorFormatState.self, from: data)
            else { return }
            if decoded != state { state = decoded }
        case "dirty":
            isDirty = true
            revision &+= 1
        default:
            break
        }
    }
}

extension PostBodyEditor: WKNavigationDelegate {
    /// The bundled page loads; nothing else does. Links in the body are for
    /// readers of the published post, not for tapping while writing.
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void) {
        decisionHandler(action.request.url?.isFileURL == true ? .allow : .cancel)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        // iOS reclaims web content processes under memory pressure. Reloading
        // brings the editor back empty, so say so rather than showing a blank
        // page that looks like the post was wiped. The local draft still has it.
        isReady = false
        failure = "The editor was stopped by iOS to free memory. Your last autosave is kept — reopen the post to restore it."
    }
}

/// `WKUserContentController` holds its handlers strongly; this keeps it from
/// holding the editor, which holds the web view, which holds the controller.
private final class WeakScriptHandler: NSObject, WKScriptMessageHandler {
    weak var target: PostBodyEditor?
    init(_ target: PostBodyEditor) { self.target = target }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        MainActor.assumeIsolated { target?.receive(message) }
    }
}

/// Puts the editor's web view into SwiftUI. The view belongs to the
/// `PostBodyEditor`, not to this wrapper, so SwiftUI rebuilding the wrapper
/// never reloads the page or loses the cursor.
struct PostBodyEditorView: UIViewRepresentable {
    @ObservedObject var editor: PostBodyEditor

    func makeUIView(context: Context) -> WKWebView { editor.webView }
    func updateUIView(_ view: WKWebView, context: Context) {}
}
