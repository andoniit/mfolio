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

    var state: ModerationStatus { status ?? .approved }
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

    // Default to false: an unknown flag should read as "not live" rather than
    // claiming something is published when we can't tell.
    var isPublished: Bool { published ?? false }
    var isTrashed: Bool { trashed_at != nil }
}
