import Charts
import SwiftUI

/// The building blocks of the card dashboard. Kept apart from the screen so
/// the screen reads as layout, and so every card shares one shape, padding and
/// press feel.
enum CardStyle {
    static let corner: CGFloat = 20
    static let padding: CGFloat = 14
    static let spacing: CGFloat = 12

    static var background: Color { Color(.secondarySystemGroupedBackground) }

    /// Two columns on a phone, more as the width allows (iPad, landscape).
    static let grid = [GridItem(.adaptive(minimum: 158), spacing: spacing)]
}

/// A card's surface. Everything on the dashboard sits on one of these.
struct CardSurface<Content: View>: View {
    var padding: CGFloat = CardStyle.padding
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(CardStyle.background,
                        in: RoundedRectangle(cornerRadius: CardStyle.corner, style: .continuous))
    }
}

/// Cards are links; this gives them a physical press instead of the flat
/// highlight a list row gets.
struct CardPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.92 : 1)
            .animation(.spring(duration: 0.22), value: configuration.isPressed)
    }
}

/// A section with a number worth seeing at a glance: posts, projects, photos.
/// `wide` lays it out in one row, for a card that spans the grid on its own.
struct StatCard: View {
    let icon: String
    let tint: Color
    let title: String
    let value: Int
    let detail: String
    var badge = 0
    var wide = false

    var body: some View {
        CardSurface {
            if wide { wideLayout } else { tileLayout }
        }
        .accessibilityElement(children: .combine)
    }

    private var wideLayout: some View {
        HStack(spacing: 12) {
            GlyphTile(icon: icon, tint: tint, size: 34)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(.primary)
                Text(detail).font(.caption).foregroundStyle(.secondary).lineLimit(1)
            }
            Spacer(minLength: 8)
            if badge > 0 { CountBadge(value: badge) }
            Text(value.formatted())
                .font(.system(.title, design: .rounded).weight(.bold))
                .monospacedDigit()
                .contentTransition(.numericText())
                .foregroundStyle(.primary)
        }
    }

    private var tileLayout: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                GlyphTile(icon: icon, tint: tint, size: 34)
                Spacer(minLength: 0)
                if badge > 0 {
                    CountBadge(value: badge)
                        .accessibilityLabel("\(badge) waiting for review")
                }
            }
            .padding(.bottom, 12)
            Text(value.formatted())
                .font(.system(.title, design: .rounded).weight(.bold))
                .monospacedDigit()
                .contentTransition(.numericText())
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)
            Text(detail)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .padding(.top, 1)
        }
    }
}

/// A place to go rather than a number to read: newsletter, tags, SEO.
struct ToolCard: View {
    let icon: String
    let tint: Color
    let title: String
    var detail: String?

    var body: some View {
        CardSurface(padding: 12) {
            HStack(spacing: 10) {
                GlyphTile(icon: icon, tint: tint, size: 30)
                VStack(alignment: .leading, spacing: 1) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    if let detail {
                        Text(detail).font(.caption2).foregroundStyle(.secondary).lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

/// Section heading above a group of cards, in the grouped-list header style.
struct CardSectionHeader: View {
    let title: String
    var body: some View {
        Text(title)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(.secondary)
            .textCase(.uppercase)
            .padding(.leading, 4)
            .accessibilityAddTraits(.isHeader)
    }
}

/// The dashboard's lead card: how many people saw the site this week, which
/// way that's heading, and who's on it now. A glance, not the report — tapping
/// opens Analytics for the rest.
struct TrafficCard: View {
    enum State {
        case loading
        case ready(AnalyticsSnapshot)
        case notConnected
        case failed
    }

    let state: State

    var body: some View {
        CardSurface {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    GlyphTile(icon: "chart.line.uptrend.xyaxis", tint: Theme.Accent.analytics, size: 30)
                    VStack(alignment: .leading, spacing: 0) {
                        Text("Traffic").font(.subheadline.weight(.semibold)).foregroundStyle(.primary)
                        Text("Last 7 days").font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer(minLength: 0)
                    if case .ready(let snap) = state, snap.realtimeUsers > 0 {
                        LivePill(count: snap.realtimeUsers)
                    }
                    Image(systemName: "chevron.right")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(.tertiary)
                }
                content
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch state {
        case .loading:
            figures(views: 1234, visitors: 321, delta: 0.12, daily: [])
                .redacted(reason: .placeholder)
        case .ready(let snap):
            figures(views: snap.totals.views, visitors: snap.totals.users,
                    delta: delta(snap), daily: snap.daily)
        case .notConnected:
            Text("Connect Google Analytics to see visitors here.")
                .font(.footnote).foregroundStyle(.secondary)
        case .failed:
            Text("Couldn't load traffic right now. Tap to open Analytics.")
                .font(.footnote).foregroundStyle(.secondary)
        }
    }

    private func figures(views: Int, visitors: Int, delta: Double?, daily: [AnalyticsDay]) -> some View {
        HStack(alignment: .bottom, spacing: 16) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(views.formatted())
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .contentTransition(.numericText())
                        .foregroundStyle(.primary)
                    if let delta { TrendLabel(delta: delta) }
                }
                Text("views · \(visitors.formatted()) visitors")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            if !daily.isEmpty {
                Sparkbars(days: daily)
                    .frame(width: 118, height: 46)
                    .accessibilityHidden(true)
            }
        }
    }

    /// Against the seven days before. Nothing to compare with is no trend,
    /// not "+100%".
    private func delta(_ snap: AnalyticsSnapshot) -> Double? {
        let before = snap.previousTotals.views
        guard before > 0 else { return nil }
        return Double(snap.totals.views - before) / Double(before)
    }
}

struct TrendLabel: View {
    let delta: Double
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: delta >= 0 ? "arrow.up.right" : "arrow.down.right")
            Text(abs(delta).formatted(.percent.precision(.fractionLength(0))))
        }
        .font(.caption.weight(.bold))
        .foregroundStyle(delta >= 0 ? Color.green : Color.red)
        .accessibilityLabel("\(delta >= 0 ? "Up" : "Down") \(abs(delta).formatted(.percent.precision(.fractionLength(0)))) on the week before")
    }
}

/// "● 3 now" — people on the site in the last 30 minutes.
struct LivePill: View {
    let count: Int
    var body: some View {
        HStack(spacing: 5) {
            Circle().fill(.green).frame(width: 7, height: 7)
            Text("\(count) now").font(.caption2.weight(.semibold)).monospacedDigit()
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.green.opacity(0.14), in: Capsule())
        .foregroundStyle(.green)
        .accessibilityLabel("\(count) on the site now")
    }
}

/// Views per day as a strip of bars, today last. No axes: the card's number
/// carries the value; this carries the shape.
struct Sparkbars: View {
    let days: [AnalyticsDay]
    var body: some View {
        Chart(days) { day in
            BarMark(x: .value("Day", day.date, unit: .day), y: .value("Views", day.views))
                .foregroundStyle(Theme.Accent.analytics.gradient)
                .clipShape(RoundedRectangle(cornerRadius: 2, style: .continuous))
        }
        .chartXAxis(.hidden)
        .chartYAxis(.hidden)
        .chartLegend(.hidden)
    }
}

/// Visitor submissions waiting on you — the one thing that should be seen
/// before anything else, with a way straight to each queue.
struct ReviewCard<Photos: View, Notes: View>: View {
    let photos: Int
    let notes: Int
    @ViewBuilder var photosDestination: Photos
    @ViewBuilder var notesDestination: Notes

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "tray.full.fill")
                    .font(.title3)
                    .foregroundStyle(.white)
                    .frame(width: 38, height: 38)
                    .background(.white.opacity(0.22), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                VStack(alignment: .leading, spacing: 1) {
                    Text("\(photos + notes) waiting for review")
                        .font(.headline)
                    Text("Visitors left these on the site")
                        .font(.caption)
                        .opacity(0.85)
                }
                Spacer(minLength: 0)
            }
            HStack(spacing: 8) {
                if photos > 0 {
                    NavigationLink { photosDestination } label: {
                        chip("camera.fill", "\(photos) photo\(photos == 1 ? "" : "s")")
                    }
                }
                if notes > 0 {
                    NavigationLink { notesDestination } label: {
                        chip("quote.bubble.fill", "\(notes) note\(notes == 1 ? "" : "s")")
                    }
                }
            }
            .buttonStyle(CardPressStyle())
        }
        .foregroundStyle(.white)
        .padding(CardStyle.padding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(colors: [.orange, .pink], startPoint: .topLeading, endPoint: .bottomTrailing),
            in: RoundedRectangle(cornerRadius: CardStyle.corner, style: .continuous)
        )
    }

    private func chip(_ icon: String, _ text: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
            Text(text)
            Image(systemName: "chevron.right").font(.caption2.weight(.bold)).opacity(0.7)
        }
        .font(.footnote.weight(.semibold))
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(.white.opacity(0.22), in: Capsule())
    }
}

/// A short, prominent action — "New post", "View site".
struct QuickActionLabel: View {
    let icon: String
    let title: String
    let tint: Color

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.body.weight(.semibold))
            Text(title).font(.subheadline.weight(.semibold))
        }
        .foregroundStyle(tint)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(tint.opacity(0.13), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}
