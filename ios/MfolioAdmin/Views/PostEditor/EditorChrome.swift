import PhotosUI
import SwiftUI

// Pieces shared by the rich-text editors (blog posts and projects): the
// recovered-draft banner, the "Saved" toast, link entry and inline photos.
// Each screen owns its own fields and saving; these are the parts that must
// behave identically in both.

/// Offers back an autosaved draft found on open.
struct DraftRecoveryBanner: View {
    let savedAt: Date
    var onDiscard: () -> Void
    var onRestore: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "clock.arrow.circlepath").foregroundStyle(.orange)
            VStack(alignment: .leading, spacing: 1) {
                Text("Unsaved changes found").font(.subheadline.weight(.semibold))
                Text("From \(savedAt.formatted(date: .abbreviated, time: .shortened))")
                    .font(.caption).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            Button("Discard", action: onDiscard).font(.footnote)
            Button("Restore", action: onRestore)
                .font(.footnote.weight(.semibold))
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
        }
        .padding(.horizontal, Theme.gutter)
        .padding(.vertical, 10)
        .background(Color.orange.opacity(0.12))
    }
}

/// The brief confirmation that drops in after a save.
struct SaveToast: View {
    let message: String?

    var body: some View {
        if let message {
            Label(message, systemImage: "checkmark.circle.fill")
                .font(.footnote.weight(.semibold))
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(.regularMaterial, in: Capsule())
                .padding(.top, 10)
                .transition(.move(edge: .top).combined(with: .opacity))
        }
    }
}

/// What the link alert is editing.
struct LinkPrompt {
    var href: String
    var text: String
    var needsText: Bool
    var existing: Bool

    /// Asks for link text too when nothing is selected and the cursor isn't
    /// already in a link — otherwise there'd be nothing to put the link on.
    init(for state: EditorFormatState) {
        href = state.linkHref
        text = ""
        needsText = !state.hasSelection && !state.link
        existing = state.link
    }

    /// Adds `https://` to a bare domain; leaves mailto:, tel:, #anchors and
    /// site-relative paths alone. Blank means nothing to add.
    static func normalized(_ raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        if trimmed.hasPrefix("/") || trimmed.hasPrefix("#") { return trimmed }
        if trimmed.range(of: #"^[a-zA-Z][a-zA-Z0-9+.-]*:"#, options: .regularExpression) != nil { return trimmed }
        return "https://" + trimmed
    }
}

extension View {
    /// The add / change / remove link alert, applied to the editor.
    func linkPrompt(_ prompt: Binding<LinkPrompt?>, editor: PostBodyEditor) -> some View {
        modifier(LinkPromptAlert(prompt: prompt, editor: editor))
    }
}

private struct LinkPromptAlert: ViewModifier {
    @Binding var prompt: LinkPrompt?
    let editor: PostBodyEditor

    func body(content: Content) -> some View {
        content.alert("Link", isPresented: shown, presenting: prompt) { current in
            if current.needsText {
                TextField("Text", text: Binding(get: { prompt?.text ?? "" }, set: { prompt?.text = $0 }))
            }
            TextField("https://", text: Binding(get: { prompt?.href ?? "" }, set: { prompt?.href = $0 }))
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()

            Button(current.existing ? "Update" : "Add") {
                if let p = prompt, let href = LinkPrompt.normalized(p.href) {
                    editor.setLink(href, text: p.needsText ? p.text.trimmingCharacters(in: .whitespaces) : nil)
                }
                prompt = nil
            }
            if current.existing {
                Button("Remove link", role: .destructive) {
                    editor.setLink("", text: nil)
                    prompt = nil
                }
            }
            Button("Cancel", role: .cancel) { prompt = nil }
        } message: { current in
            Text(current.existing ? "Change or remove this link." : "Add a link to the selected text.")
        }
    }

    private var shown: Binding<Bool> {
        Binding(get: { prompt != nil }, set: { if !$0 { prompt = nil } })
    }
}

extension PostBodyEditor {
    /// Shrinks a picked photo on the phone, uploads it to `editor/` (where the
    /// web editor puts in-body images too) and inserts it at the cursor.
    func insertPhoto(_ item: PhotosPickerItem, auth: AuthStore) async throws {
        guard let raw = try await item.loadTransferable(type: Data.self) else { return }
        guard let optimized = ImageOptimizer.optimize(raw) else {
            throw APIError(status: -1, message: "That image couldn't be read.")
        }
        let uploaded = try await ImageUploader.upload(optimized, folder: "editor", auth: auth)
        insertImage(url: uploaded.publicURL, alt: nil)
    }
}
