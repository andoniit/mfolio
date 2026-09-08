import Foundation

/// Codable mirror of `/api/admin/analytics`.
///
/// Everything is decoded defensively — a missing key becomes a zero or an
/// empty list rather than a thrown error. GA4 drops whole sections when a
/// property has no data for them, and one absent breakdown should not blank
/// the screen.
struct AnalyticsSnapshot: Decodable {
    var configured = true
    /// Why analytics is unavailable, when `configured` is false.
    var reason: String?
    var propertyId: String?
    var days = 28
    var generatedAt: Date?

    var totals = AnalyticsTotals()
    var previousTotals = AnalyticsTotals()
    var daily: [AnalyticsDay] = []

    var realtimeUsers = 0
    var realtimeCountries: [AnalyticsRow] = []

    var countries: [AnalyticsRow] = []
    var regions: [AnalyticsRow] = []
    var cities: [AnalyticsRow] = []
    var pages: [AnalyticsRow] = []
    var devices: [AnalyticsRow] = []
    var channels: [AnalyticsRow] = []
    var sources: [AnalyticsRow] = []
    var browsers: [AnalyticsRow] = []

    /// Distinguishes "not loaded yet" from "a genuinely quiet week", so the
    /// spinner shows on first load only.
    var isLoaded = false

    init() {}

    private enum CodingKeys: String, CodingKey {
        case configured, reason, propertyId, days, generatedAt
        case totals, previousTotals, daily
        case realtimeUsers, realtimeCountries
        case countries, regions, cities, pages, devices, channels, sources, browsers
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        func rows(_ key: CodingKeys) -> [AnalyticsRow] {
            (try? c.decode([AnalyticsRow].self, forKey: key)) ?? []
        }

        configured = (try? c.decode(Bool.self, forKey: .configured)) ?? true
        reason = try? c.decodeIfPresent(String.self, forKey: .reason)
        propertyId = try? c.decodeIfPresent(String.self, forKey: .propertyId)
        days = (try? c.decode(Int.self, forKey: .days)) ?? 28
        generatedAt = try? c.decodeIfPresent(Date.self, forKey: .generatedAt)

        totals = (try? c.decode(AnalyticsTotals.self, forKey: .totals)) ?? AnalyticsTotals()
        previousTotals = (try? c.decode(AnalyticsTotals.self, forKey: .previousTotals)) ?? AnalyticsTotals()
        daily = (try? c.decode([AnalyticsDay].self, forKey: .daily)) ?? []

        realtimeUsers = (try? c.decode(Int.self, forKey: .realtimeUsers)) ?? 0
        realtimeCountries = rows(.realtimeCountries)

        countries = rows(.countries)
        regions = rows(.regions)
        cities = rows(.cities)
        pages = rows(.pages)
        devices = rows(.devices)
        channels = rows(.channels)
        sources = rows(.sources)
        browsers = rows(.browsers)

        isLoaded = true
    }

    /// The busiest day in the range — the chart annotates it.
    var peakDay: AnalyticsDay? { daily.max { $0.views < $1.views } }

    var averageViewsPerDay: Double {
        guard !daily.isEmpty else { return 0 }
        return Double(daily.reduce(0) { $0 + $1.views }) / Double(daily.count)
    }
}

struct AnalyticsTotals: Decodable {
    var views = 0
    var users = 0
    var newUsers = 0
    var sessions = 0
    /// 0–1, as GA4 reports it.
    var engagementRate: Double = 0
    var avgSessionSeconds: Double = 0

    init() {}

    private enum CodingKeys: String, CodingKey {
        case views, users, newUsers, sessions, engagementRate, avgSessionSeconds
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        func i(_ k: CodingKeys) -> Int { Int((try? c.decode(Double.self, forKey: k)) ?? 0) }
        func d(_ k: CodingKeys) -> Double { (try? c.decode(Double.self, forKey: k)) ?? 0 }
        views = i(.views)
        users = i(.users)
        newUsers = i(.newUsers)
        sessions = i(.sessions)
        engagementRate = d(.engagementRate)
        avgSessionSeconds = d(.avgSessionSeconds)
    }

    var returningUsers: Int { max(0, users - newUsers) }
}

struct AnalyticsDay: Decodable, Identifiable {
    let date: Date
    var views = 0
    var users = 0
    var sessions = 0

    var id: Date { date }

    private enum CodingKeys: String, CodingKey { case date, views, users, sessions }

    /// GA4 dates are plain calendar days in the property's timezone. Parsed
    /// with a fixed UTC calendar so the chart's buckets never shift when the
    /// phone crosses a timezone.
    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let raw = (try? c.decode(String.self, forKey: .date)) ?? ""
        date = Self.dayFormatter.date(from: raw) ?? Date(timeIntervalSince1970: 0)
        views = (try? c.decode(Int.self, forKey: .views)) ?? 0
        users = (try? c.decode(Int.self, forKey: .users)) ?? 0
        sessions = (try? c.decode(Int.self, forKey: .sessions)) ?? 0
    }
}

/// One line in a breakdown — a country, a city, a page, a referrer.
struct AnalyticsRow: Decodable, Identifiable {
    let id = UUID()
    var label = ""
    var sublabel: String?
    var views = 0
    var users = 0
    var sessions = 0

    private enum CodingKeys: String, CodingKey { case label, sublabel, views, users, sessions }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        label = (try? c.decode(String.self, forKey: .label)) ?? "Unknown"
        sublabel = try? c.decodeIfPresent(String.self, forKey: .sublabel)
        views = (try? c.decode(Int.self, forKey: .views)) ?? 0
        users = (try? c.decode(Int.self, forKey: .users)) ?? 0
        sessions = (try? c.decode(Int.self, forKey: .sessions)) ?? 0
    }
}

/// The ranges the picker offers. Kept in sync with `ALLOWED_DAYS` in the route,
/// which falls back to 28 for anything else.
enum AnalyticsRange: Int, CaseIterable, Identifiable {
    case week = 7
    case month = 28
    case quarter = 90
    case year = 365

    var id: Int { rawValue }

    var shortTitle: String {
        switch self {
        case .week: "7D"
        case .month: "28D"
        case .quarter: "90D"
        case .year: "1Y"
        }
    }

    var longTitle: String {
        switch self {
        case .week: "last 7 days"
        case .month: "last 28 days"
        case .quarter: "last 90 days"
        case .year: "last year"
        }
    }
}
