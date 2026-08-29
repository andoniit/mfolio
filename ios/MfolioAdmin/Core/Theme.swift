import SwiftUI

/// Shared look for the app. Kept in one place so screens stay consistent as
/// they get added, rather than each inventing its own spacing and colours.
enum Theme {
    static let corner: CGFloat = 16
    static let tileCorner: CGFloat = 10
    static let gutter: CGFloat = 16

    /// Section accents. Deliberately matched to the web dashboard's ordering so
    /// the two feel like the same product.
    enum Accent {
        static let outside = Color.indigo
        static let photoWall = Color.pink
        static let recommendations = Color.orange
        static let blog = Color.teal
        static let projects = Color.blue
        static let experience = Color.brown
        static let volunteer = Color.red
        static let categories = Color.purple
        static let tags = Color.mint
        static let newsletter = Color.cyan
        static let resume = Color.gray
        static let web = Color.blue
    }
}

/// A rounded app-icon-style glyph, the visual anchor for every row and card.
struct GlyphTile: View {
    let icon: String
    let tint: Color
    var size: CGFloat = 30

    var body: some View {
        Image(systemName: icon)
            .font(.system(size: size * 0.5, weight: .semibold))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(
                LinearGradient(colors: [tint, tint.opacity(0.78)],
                               startPoint: .topLeading, endPoint: .bottomTrailing),
                in: RoundedRectangle(cornerRadius: size * 0.29, style: .continuous)
            )
    }
}

/// Small capsule used for published / draft / pending states.
struct StatusPill: View {
    let text: String
    let tint: Color

    var body: some View {
        Text(text)
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(tint.opacity(0.15), in: Capsule())
            .foregroundStyle(tint)
    }
}

/// Red count bubble for anything awaiting review.
struct CountBadge: View {
    let value: Int

    var body: some View {
        Text("\(value)")
            .font(.caption2.bold())
            .foregroundStyle(.white)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(.red, in: Capsule())
    }
}

/// One inline error, styled so a failed section reads as a state rather than
/// a crash — with a retry, because most failures here are transient.
struct ErrorCard: View {
    let message: String
    var retry: (() -> Void)?

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)
            VStack(alignment: .leading, spacing: 6) {
                Text(message).font(.footnote).foregroundStyle(.secondary)
                if let retry {
                    Button("Try again", action: retry)
                        .font(.footnote.weight(.semibold))
                }
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, 4)
    }
}
