import Foundation

enum ModerationStatus: String, Codable {
    case pending, approved, rejected
}

/// A visitor's Polaroid from `photo_wall_posts`.
struct PhotoWallPost: Codable, Identifiable, Hashable {
    let id: String
    var image_url: String
    var message: String
    var author_name: String?
    var status: ModerationStatus?
    var created_at: String?
    /// Position on the wall; lower first, then newest first.
    var sort_order: Int?

    var state: ModerationStatus { status ?? .approved }

    /// "21 Sep 2026, 11:04" for the detail view.
    var submittedLine: String? {
        guard let created_at else { return nil }
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = f.date(from: created_at) ?? ISO8601DateFormatter().date(from: created_at)
        return date?.formatted(date: .abbreviated, time: .shortened)
    }
}

/// A visitor's sticky note from `recommendations`.
struct Recommendation: Codable, Identifiable, Hashable {
    let id: String
    var name: String
    var role: String?
    var message: String
    var avatar_url: String?
    var status: ModerationStatus?
    var created_at: String?

    var state: ModerationStatus { status ?? .approved }
}

/// Trimmed project row — enough to list and toggle publishing.
struct ProjectSummary: Codable, Identifiable, Hashable {
    let id: String
    var title: String
    var slug: String?
    var description: String?
    var cover_image_url: String?
    var workplace: String?
    var published: Bool?
    var trashed_at: String?
    var home_feature_order: Int?

    // Default to false: an unknown flag should read as "not live" rather than
    // claiming something is published when we can't tell.
    var isPublished: Bool { published ?? false }
    var isTrashed: Bool { trashed_at != nil }
}
