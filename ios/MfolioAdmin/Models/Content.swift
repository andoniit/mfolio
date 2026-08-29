import Foundation

/// A row from `posts`. The body lives in `content_json` and is only ever
/// edited in the web editor, so it is deliberately not modelled here.
struct BlogPost: Codable, Identifiable, Hashable {
    let id: String
    var title: String
    var slug: String?
    var excerpt: String?
    var cover_image_url: String?
    var published: Bool?
    var published_at: String?
    var trashed_at: String?

    var isPublished: Bool { published ?? false }
    var isTrashed: Bool { trashed_at != nil }
}

/// A row from `experiences`. Covers both tabs — work history and voluntary
/// roles are the same table split by `category`.
struct ExperienceItem: Codable, Identifiable, Hashable {
    let id: String
    var title: String
    var company: String
    var company_url: String?
    var location: String?
    var employment_type: String?
    var start_date: String?
    var end_date: String?
    var is_current: Bool?
    var description: String?
    var highlights: [String]?
    var skills: [String]?
    var sort_order: Int?
    var published: Bool?
    var trashed_at: String?
    var category: String?

    var isPublished: Bool { published ?? false }
    var isTrashed: Bool { trashed_at != nil }

    /// "Jan 2024 — Present" style line for the list row.
    var dateLine: String {
        let from = ExperienceItem.month(start_date)
        let to = (is_current ?? false) ? "Present" : ExperienceItem.month(end_date)
        switch (from.isEmpty, to.isEmpty) {
        case (true, true): return ""
        case (false, true): return from
        case (true, false): return to
        default: return "\(from) — \(to)"
        }
    }

    private static func month(_ iso: String?) -> String {
        guard let iso, iso.count >= 7 else { return "" }
        let parts = iso.split(separator: "-")
        guard parts.count >= 2, let m = Int(parts[1]), (1...12).contains(m) else { return "" }
        let names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        return "\(names[m - 1]) \(parts[0])"
    }
}

/// Categories and tags share a shape, so one model and one screen serve both.
struct Taxonomy: Codable, Identifiable, Hashable {
    let id: String
    var name: String
    var slug: String?
}

/// A newsletter signup. Read-only in the app.
struct Subscriber: Codable, Identifiable, Hashable {
    let id: String
    var email: String
    var name: String?
    var status: String?
    var source: String?
    var subscribed_at: String?

    var isActive: Bool { (status ?? "active") == "active" }
}

/// `GET /api/resume` answers with the current file, or `{ "url": null }`.
struct ResumeInfo: Codable {
    var url: String?
}
