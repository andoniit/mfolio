import Foundation

enum OutsideKind: String, Codable, CaseIterable, Identifiable {
    case photo, food, game
    var id: String { rawValue }

    var title: String {
        switch self {
        case .photo: return "Photos"
        case .food: return "Food spots"
        case .game: return "Games"
        }
    }
    var symbol: String {
        switch self {
        case .photo: return "photo.on.rectangle.angled"
        case .food: return "fork.knife"
        case .game: return "gamecontroller.fill"
        }
    }
    /// Labels the one form reuses across all three kinds.
    var titleLabel: String {
        switch self {
        case .photo: return "Caption"
        case .food: return "Place or dish"
        case .game: return "Game title"
        }
    }
    var subtitleLabel: String {
        switch self {
        case .photo: return "Where / when"
        case .food: return "City or cuisine"
        case .game: return "Platform"
        }
    }
    var storageFolder: String { "outside-of-work/\(rawValue)" }
}

enum GameStatus: String, Codable, CaseIterable, Identifiable {
    case playing, completed, backlog, wishlist
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
}

/// Mirrors a row of `outside_of_work_items`. Every field the admin API returns
/// with `?all=1`; optional throughout because the public shape omits several.
struct OutsideItem: Codable, Identifiable, Hashable {
    let id: String
    var kind: OutsideKind
    var title: String
    var subtitle: String?
    var description: String?
    var image_url: String?
    var storage_path: String?
    var link_url: String?
    var rating: Int?
    var game_status: GameStatus?
    var is_published: Bool?
    var sort_order: Int?

    var published: Bool { is_published ?? true }
}

/// `GET /api/outside-of-work` returns the three tiles already grouped.
struct OutsideOfWorkPayload: Codable {
    var photos: [OutsideItem]
    var food: [OutsideItem]
    var games: [OutsideItem]

    var all: [OutsideItem] { photos + food + games }

    func items(for kind: OutsideKind) -> [OutsideItem] {
        switch kind {
        case .photo: return photos
        case .food: return food
        case .game: return games
        }
    }
}
