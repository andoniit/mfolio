import SwiftUI

/// A form section for an ordered list of short strings — tech stack,
/// collaborators, highlights, skills. Add with the field at the bottom, swipe
/// to delete, and drag to reorder once the surrounding form is in Edit mode.
/// Adding something already there (ignoring case) is a no-op, not a duplicate.
struct EditableListSection: View {
    let title: String
    @Binding var items: [String]
    let placeholder: String
    let empty: String
    var footer: String?
    /// Highlights are sentences; tags and names are single lines.
    var multiline = false

    @State private var draft = ""

    var body: some View {
        Section {
            if items.isEmpty {
                Text(empty).font(.footnote).foregroundStyle(.secondary)
            }
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                Text(item)
            }
            .onDelete { items.remove(atOffsets: $0) }
            .onMove { items.move(fromOffsets: $0, toOffset: $1) }

            HStack(alignment: multiline ? .top : .center) {
                if multiline {
                    TextField(placeholder, text: $draft, axis: .vertical).lineLimit(1...4)
                } else {
                    TextField(placeholder, text: $draft)
                        .submitLabel(.done)
                        .onSubmit(add)
                }
                Button("Add", action: add)
                    .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        } header: {
            Text(title)
        } footer: {
            if let footer { Text(footer) }
        }
    }

    private func add() {
        let value = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { return }
        if !items.contains(where: { $0.caseInsensitiveCompare(value) == .orderedSame }) {
            items.append(value)
        }
        draft = ""
    }
}
