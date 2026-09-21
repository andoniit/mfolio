import SwiftUI

/// The formatting toolbar under the post body. It rides on top of the keyboard
/// because SwiftUI shrinks the layout for it, and lights up from the editor's
/// reported state so it always shows what the cursor is sitting in.
///
/// Covers everything the web toolbar does: text styles, marks, highlight,
/// links, lists (with indent), quote, code, images, alignment, sub/superscript
/// and dividers.
struct FormatBar: View {
    @ObservedObject var editor: PostBodyEditor
    var onImage: () -> Void
    var onLink: () -> Void

    private var s: EditorFormatState { editor.state }

    var body: some View {
        HStack(spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 2) {
                    icon("arrow.uturn.backward", "Undo", enabled: s.canUndo) { editor.exec("undo") }
                    icon("arrow.uturn.forward", "Redo", enabled: s.canRedo) { editor.exec("redo") }
                    divider

                    textStyleMenu
                    icon("bold", "Bold", active: s.bold) { editor.exec("bold") }
                    icon("italic", "Italic", active: s.italic) { editor.exec("italic") }
                    icon("underline", "Underline", active: s.underline) { editor.exec("underline") }
                    icon("strikethrough", "Strikethrough", active: s.strike) { editor.exec("strike") }
                    icon("highlighter", "Highlight", active: s.highlight) { editor.exec("highlight") }
                    icon("link", "Link", active: s.link, action: onLink)
                    divider

                    listMenu
                    icon("text.quote", "Quote", active: s.blockquote) { editor.exec("blockquote") }
                    codeMenu
                    icon("photo", "Insert image", action: onImage)
                    divider

                    moreMenu
                }
                .padding(.horizontal, 8)
            }

            if s.focused {
                Divider().frame(height: 24)
                Button { editor.dismissKeyboard() } label: {
                    Image(systemName: "keyboard.chevron.compact.down")
                        .frame(width: 44, height: 44)
                }
                .accessibilityLabel("Hide keyboard")
            }
        }
        .frame(height: 48)
        .font(.system(size: 17, weight: .medium))
        .background(.bar)
        .overlay(alignment: .top) { Divider() }
        .disabled(!editor.isReady)
    }

    // MARK: - Menus

    private var textStyleMenu: some View {
        Menu {
            Picker("Text style", selection: headingBinding) {
                Text("Body").tag(0)
                Text("Heading 1").tag(1)
                Text("Heading 2").tag(2)
                Text("Heading 3").tag(3)
                Text("Heading 4").tag(4)
            }
        } label: {
            Text(s.heading == 0 ? "Aa" : "H\(s.heading)")
                .font(.system(size: 16, weight: .semibold))
                // A Menu label takes the accent tint by default; this one only
                // lights up when a heading is active, like every other button.
                .foregroundStyle(s.heading == 0 ? Color.primary : Color.accentColor)
                .frame(minWidth: 40, minHeight: 36)
                .background(s.heading == 0 ? Color.clear : Color.accentColor.opacity(0.15),
                            in: RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .accessibilityLabel("Text style")
    }

    /// Picking the current heading again turns it back into body text, which is
    /// what toggleHeading does — so "Body" and a re-pick both land on paragraph.
    private var headingBinding: Binding<Int> {
        Binding(
            get: { s.heading },
            set: { level in
                if level == 0 { editor.exec("paragraph") } else { editor.exec("heading", level) }
            }
        )
    }

    private var listMenu: some View {
        Menu {
            toggle("Bulleted list", "list.bullet", s.bulletList) { editor.exec("bulletList") }
            toggle("Numbered list", "list.number", s.orderedList) { editor.exec("orderedList") }
            toggle("Checklist", "checklist", s.taskList) { editor.exec("taskList") }
            if s.inList {
                Divider()
                Button { editor.exec("indent") } label: { Label("Indent", systemImage: "increase.indent") }
                Button { editor.exec("outdent") } label: { Label("Outdent", systemImage: "decrease.indent") }
            }
        } label: {
            glyph(listIcon, active: s.inList)
        }
        .accessibilityLabel("Lists")
    }

    private var listIcon: String {
        s.orderedList ? "list.number" : s.taskList ? "checklist" : "list.bullet"
    }

    private var codeMenu: some View {
        Menu {
            toggle("Inline code", "chevron.left.forwardslash.chevron.right", s.code) { editor.exec("code") }
            toggle("Code block", "curlybraces", s.codeBlock) { editor.exec("codeBlock") }
        } label: {
            glyph("chevron.left.forwardslash.chevron.right", active: s.code || s.codeBlock)
        }
        .accessibilityLabel("Code")
    }

    private var moreMenu: some View {
        Menu {
            Section("Alignment") {
                toggle("Left", "text.alignleft", s.align == "left") { editor.exec("align", "left") }
                toggle("Center", "text.aligncenter", s.align == "center") { editor.exec("align", "center") }
                toggle("Right", "text.alignright", s.align == "right") { editor.exec("align", "right") }
                toggle("Justify", "text.justify", s.align == "justify") { editor.exec("align", "justify") }
            }
            Section {
                toggle("Superscript", "textformat.superscript", s.superscript) { editor.exec("superscript") }
                toggle("Subscript", "textformat.subscript", s.subscript) { editor.exec("subscript") }
            }
            Section {
                Button { editor.exec("horizontalRule") } label: { Label("Divider", systemImage: "minus") }
                Button { editor.exec("clearFormatting") } label: { Label("Clear formatting", systemImage: "eraser") }
            }
        } label: {
            glyph("ellipsis.circle", active: s.align != "left" || s.superscript || s.subscript)
        }
        .accessibilityLabel("More formatting")
    }

    // MARK: - Pieces

    private var divider: some View {
        Divider().frame(height: 22).padding(.horizontal, 4)
    }

    private func icon(_ name: String, _ label: String, active: Bool = false, enabled: Bool = true,
                      action: @escaping () -> Void) -> some View {
        Button(action: action) { glyph(name, active: active, enabled: enabled) }
            .disabled(!enabled)
            .accessibilityLabel(label)
            .accessibilityAddTraits(active ? .isSelected : [])
    }

    /// The colour is explicit, which also switches off SwiftUI's automatic
    /// dimming of disabled buttons — so `enabled` has to dim it by hand.
    private func glyph(_ name: String, active: Bool, enabled: Bool = true) -> some View {
        Image(systemName: name)
            .frame(width: 38, height: 36)
            .foregroundStyle(active ? Color.accentColor : enabled ? Color.primary : Color(.tertiaryLabel))
            .background(active ? Color.accentColor.opacity(0.15) : Color.clear,
                        in: RoundedRectangle(cornerRadius: 8, style: .continuous))
    }

    /// A menu row with a checkmark when it's already applied.
    private func toggle(_ title: String, _ icon: String, _ on: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            if on { Label(title, systemImage: "checkmark") } else { Label(title, systemImage: icon) }
        }
    }
}
