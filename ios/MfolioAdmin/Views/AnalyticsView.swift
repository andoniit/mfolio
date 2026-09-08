import Charts
import SwiftUI

/// Google Analytics for the site, read-only.
///
/// The phone never holds a Google credential: `/api/admin/analytics` signs a
/// service-account assertion server-side and returns plain numbers, the same
/// way every other screen here talks to the site's own API.
struct AnalyticsView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var snapshot = AnalyticsSnapshot()
    @State private var range: AnalyticsRange = .month
    @State private var chartMetric: DailyMetric = .views
    @State private var selectedDate: Date?
    @State private var loading = true
    @State private var error: String?

    var body: some View {
        List {
            if let error {
                Section { ErrorCard(message: error) { Task { await load() } } }
            }

            if snapshot.isLoaded && !snapshot.configured {
                setupSection
            } else {
                Section {
                    Picker("Range", selection: $range) {
                        ForEach(AnalyticsRange.allCases) { Text($0.shortTitle).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(Color.clear)
                }

                if snapshot.realtimeUsers > 0 {
                    Section { realtimeBanner }
                        .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                        .listRowBackground(Color.clear)
                }

                Section("Overview · \(range.longTitle)") { summaryGrid }

                Section {
                    chartCard
                } header: {
                    HStack {
                        Text("\(chartMetric.title) per day")
                        Spacer()
                        Picker("Metric", selection: $chartMetric) {
                            ForEach(DailyMetric.allCases) { Text($0.title).tag($0) }
                        }
                        .pickerStyle(.menu)
                        .font(.caption)
                        .textCase(nil)
                    }
                }

                BreakdownSection(title: "Countries", icon: "globe", tint: .blue,
                                 rows: snapshot.countries, empty: "No location data yet")
                BreakdownSection(title: "Regions", icon: "map.fill", tint: .indigo,
                                 rows: snapshot.regions, empty: "No region data yet")
                BreakdownSection(title: "Cities", icon: "building.2.fill", tint: .teal,
                                 rows: snapshot.cities, empty: "No city data yet")
                BreakdownSection(title: "Pages", icon: "doc.text.fill", tint: .orange,
                                 rows: snapshot.pages, empty: "No page views yet", monospacedLabel: true)
                BreakdownSection(title: "How they arrived", icon: "arrow.triangle.branch", tint: .purple,
                                 rows: snapshot.channels, empty: "No acquisition data yet",
                                 metric: \.sessions, unit: "sessions")
                BreakdownSection(title: "Referrers", icon: "link", tint: .pink,
                                 rows: snapshot.sources, empty: "No referrers yet",
                                 metric: \.sessions, unit: "sessions")
                BreakdownSection(title: "Devices", icon: "iphone", tint: .green,
                                 rows: snapshot.devices, empty: "No device data yet")
                BreakdownSection(title: "Browsers", icon: "safari.fill", tint: .cyan,
                                 rows: snapshot.browsers, empty: "No browser data yet")

                if let generated = snapshot.generatedAt {
                    Section {
                        EmptyView()
                    } footer: {
                        Text(footerText(generated))
                    }
                }
            }
        }
        .navigationTitle("Analytics")
        .navigationBarTitleDisplayMode(.inline)
        .overlay { if loading && !snapshot.isLoaded { ProgressView() } }
        .refreshable { await load() }
        .task(id: range) { await load() }
    }

    private func footerText(_ generated: Date) -> String {
        var line = "Google Analytics 4"
        if let id = snapshot.propertyId { line += " · property \(id)" }
        return line + " · updated " + generated.formatted(date: .omitted, time: .shortened)
        + "\nGA4 can take a few hours to finalise the most recent day."
    }

    /* ------------------------------------------------------------ realtime */

    private var realtimeBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "dot.radiowaves.left.and.right")
                .font(.title3)
                .foregroundStyle(.white)
                .frame(width: 40, height: 40)
                .background(
                    LinearGradient(colors: [.green, .teal],
                                   startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                )
            VStack(alignment: .leading, spacing: 2) {
                Text("\(snapshot.realtimeUsers) on the site right now")
                    .font(.subheadline.weight(.semibold))
                Text(realtimeDetail).font(.caption).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .background(Color(.secondarySystemGroupedBackground),
                    in: RoundedRectangle(cornerRadius: Theme.corner, style: .continuous))
    }

    private var realtimeDetail: String {
        let top = snapshot.realtimeCountries.prefix(3).map(\.label)
        return top.isEmpty ? "In the last 30 minutes" : top.joined(separator: " · ")
    }

    /* ------------------------------------------------------------- overview */

    private var summaryGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                  spacing: 12) {
            StatTile(title: "Views", value: snapshot.totals.views.formatted(),
                     delta: delta(\.views), tint: .blue, icon: "eye.fill")
            StatTile(title: "Visitors", value: snapshot.totals.users.formatted(),
                     delta: delta(\.users), tint: .indigo, icon: "person.2.fill")
            StatTile(title: "New visitors", value: snapshot.totals.newUsers.formatted(),
                     delta: delta(\.newUsers), tint: .teal, icon: "sparkles")
            StatTile(title: "Sessions", value: snapshot.totals.sessions.formatted(),
                     delta: delta(\.sessions), tint: .purple, icon: "arrow.triangle.2.circlepath")
            StatTile(title: "Engaged", value: percent(snapshot.totals.engagementRate),
                     delta: nil, tint: .green, icon: "hand.tap.fill")
            StatTile(title: "Avg. visit", value: duration(snapshot.totals.avgSessionSeconds),
                     delta: nil, tint: .orange, icon: "clock.fill")
        }
        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
        .listRowBackground(Color.clear)
    }

    /// Change against the immediately preceding window of the same length.
    /// `nil` when there is no earlier data — "+100%" against zero says nothing.
    private func delta(_ key: KeyPath<AnalyticsTotals, Int>) -> Double? {
        let before = snapshot.previousTotals[keyPath: key]
        let now = snapshot.totals[keyPath: key]
        guard before > 0 else { return nil }
        return (Double(now) - Double(before)) / Double(before)
    }

    private func percent(_ value: Double) -> String {
        value.formatted(.percent.precision(.fractionLength(0)))
    }

    private func duration(_ seconds: Double) -> String {
        let total = Int(seconds.rounded())
        guard total > 0 else { return "—" }
        let minutes = total / 60
        return minutes > 0 ? "\(minutes)m \(total % 60)s" : "\(total)s"
    }

    /* ---------------------------------------------------------------- chart */

    private var chartCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            if snapshot.daily.isEmpty {
                Text("No traffic in this range yet.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 120)
            } else {
                chartHeadline
                chart.frame(height: 180)
            }
        }
        .padding(.vertical, 4)
    }

    /// Reads out the selected day, or the average when nothing is selected —
    /// a chart on a phone is too small to read exact values off the axis.
    private var chartHeadline: some View {
        let selected = selectedDay
        return VStack(alignment: .leading, spacing: 1) {
            Text(selected.map { "\($0[keyPath: chartMetric.key].formatted()) \(chartMetric.unit)" }
                 ?? "\(Int(snapshot.averageViewsPerDay.rounded())) views/day average")
                .font(.title3.weight(.semibold))
                .contentTransition(.numericText())
            Text(selected.map { $0.date.formatted(.dateTime.weekday(.wide).day().month(.wide)) }
                 ?? "Tap and drag the chart for a single day")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var selectedDay: AnalyticsDay? {
        guard let selectedDate else { return nil }
        return snapshot.daily.min {
            abs($0.date.timeIntervalSince(selectedDate)) < abs($1.date.timeIntervalSince(selectedDate))
        }
    }

    private var chart: some View {
        Chart {
            ForEach(snapshot.daily) { day in
                // A bar per day reads better than a line at 28 points, and
                // still holds up at 365 where the bars merge into a band.
                BarMark(
                    x: .value("Day", day.date, unit: .day),
                    y: .value(chartMetric.title, day[keyPath: chartMetric.key])
                )
                .foregroundStyle(chartMetric.tint.gradient)
                .opacity(selectedDay == nil || selectedDay?.id == day.id ? 1 : 0.35)
            }

            if let selectedDay {
                RuleMark(x: .value("Day", selectedDay.date, unit: .day))
                    .foregroundStyle(.secondary.opacity(0.4))
                    .zIndex(-1)
            }
        }
        .chartXSelection(value: $selectedDate)
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisGridLine()
                AxisValueLabel {
                    if let count = value.as(Int.self) { Text(count.formatted(.number.notation(.compactName))) }
                }
            }
        }
        .chartXAxis {
            AxisMarks(values: .automatic(desiredCount: 4)) { value in
                AxisGridLine()
                AxisValueLabel(format: range == .year
                               ? Date.FormatStyle.dateTime.month(.abbreviated)
                               : Date.FormatStyle.dateTime.month(.abbreviated).day())
            }
        }
        .animation(.easeInOut(duration: 0.25), value: chartMetric)
    }

    /* ---------------------------------------------------------------- setup */

    /// Shown when the server has no GA credentials. The steps live here rather
    /// than in a README because this is where you find out they are missing.
    private var setupSection: some View {
        Section {
            VStack(alignment: .leading, spacing: 12) {
                Label("Analytics isn't connected yet", systemImage: "chart.bar.xaxis")
                    .font(.headline)
                if let reason = snapshot.reason {
                    Text(reason).font(.footnote).foregroundStyle(.secondary)
                }
                Divider()
                Text("On the server, set:").font(.footnote.weight(.semibold))
                ForEach(["GA4_PROPERTY_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"], id: \.self) { key in
                    Text(key)
                        .font(.caption.monospaced())
                        .foregroundStyle(.secondary)
                }
                Text("Then add that service account as a Viewer in Google Analytics under Admin → Property access management, and redeploy.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 6)
        }
    }

    /* ----------------------------------------------------------------- load */

    private func load() async {
        loading = true
        selectedDate = nil
        do {
            snapshot = try await APIClient(auth: auth)
                .get("/api/admin/analytics?days=\(range.rawValue)", as: AnalyticsSnapshot.self)
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}

/// Which series the day chart draws.
enum DailyMetric: String, CaseIterable, Identifiable {
    case views, visitors, sessions

    var id: String { rawValue }

    var title: String {
        switch self {
        case .views: "Views"
        case .visitors: "Visitors"
        case .sessions: "Sessions"
        }
    }

    var unit: String {
        switch self {
        case .views: "views"
        case .visitors: "visitors"
        case .sessions: "sessions"
        }
    }

    var key: KeyPath<AnalyticsDay, Int> {
        switch self {
        case .views: \.views
        case .visitors: \.users
        case .sessions: \.sessions
        }
    }

    var tint: Color {
        switch self {
        case .views: .blue
        case .visitors: .indigo
        case .sessions: .purple
        }
    }
}

/// One number in the overview grid, with its change against the previous
/// window of the same length.
private struct StatTile: View {
    let title: String
    let value: String
    let delta: Double?
    let tint: Color
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: icon).font(.caption2).foregroundStyle(tint)
                Text(title).font(.caption).foregroundStyle(.secondary)
                Spacer(minLength: 0)
            }
            Text(value).font(.title2.weight(.semibold)).minimumScaleFactor(0.6).lineLimit(1)
            if let delta {
                HStack(spacing: 2) {
                    Image(systemName: delta >= 0 ? "arrow.up.right" : "arrow.down.right")
                    Text(abs(delta).formatted(.percent.precision(.fractionLength(0))))
                }
                .font(.caption2.weight(.semibold))
                .foregroundStyle(delta >= 0 ? Color.green : Color.red)
            } else {
                Text("—").font(.caption2).foregroundStyle(.tertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(.secondarySystemGroupedBackground),
                    in: RoundedRectangle(cornerRadius: Theme.tileCorner, style: .continuous))
    }
}

/// A ranked list — countries, cities, pages, referrers. Collapsed to the top
/// five, because eight of these stacked up is a very long scroll otherwise.
private struct BreakdownSection: View {
    let title: String
    let icon: String
    let tint: Color
    let rows: [AnalyticsRow]
    let empty: String
    var metric: KeyPath<AnalyticsRow, Int> = \.views
    var unit: String = "views"
    var monospacedLabel = false

    @State private var expanded = false

    private var visible: [AnalyticsRow] { expanded ? rows : Array(rows.prefix(5)) }
    private var top: Int { max(1, rows.first?[keyPath: metric] ?? 1) }

    var body: some View {
        Section {
            if rows.isEmpty {
                Text(empty).font(.footnote).foregroundStyle(.secondary)
            } else {
                ForEach(visible) { row in
                    VStack(alignment: .leading, spacing: 5) {
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            VStack(alignment: .leading, spacing: 1) {
                                Text(row.label)
                                    .font(monospacedLabel ? .subheadline.monospaced() : .subheadline)
                                    .lineLimit(1)
                                    .truncationMode(monospacedLabel ? .middle : .tail)
                                if let sub = row.sublabel, !sub.isEmpty {
                                    Text(sub).font(.caption2).foregroundStyle(.secondary).lineLimit(1)
                                }
                            }
                            Spacer(minLength: 8)
                            Text(row[keyPath: metric].formatted())
                                .font(.subheadline.weight(.semibold).monospacedDigit())
                        }
                        // Share bar: the ranking is the point, and a number
                        // alone doesn't show how far ahead the leader is.
                        GeometryReader { geo in
                            Capsule()
                                .fill(tint.opacity(0.7))
                                .frame(width: max(2, geo.size.width * share(row)), height: 3)
                        }
                        .frame(height: 3)
                    }
                    .padding(.vertical, 2)
                }

                if rows.count > 5 {
                    Button(expanded ? "Show less" : "Show all \(rows.count)") {
                        withAnimation { expanded.toggle() }
                    }
                    .font(.footnote.weight(.semibold))
                }
            }
        } header: {
            HStack(spacing: 8) {
                GlyphTile(icon: icon, tint: tint, size: 20)
                Text(title)
                Spacer()
                if !rows.isEmpty { Text(unit).font(.caption2).foregroundStyle(.tertiary) }
            }
            .textCase(nil)
        }
    }

    private func share(_ row: AnalyticsRow) -> Double {
        Double(row[keyPath: metric]) / Double(top)
    }
}
