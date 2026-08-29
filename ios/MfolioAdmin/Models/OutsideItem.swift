import Foundation

enum OutsideKind: String, Codable, CaseIterable, Identifiable {
    case photo, game_photo, game
    var id: String { rawValue }

    var title: String {
        switch self {
        case .photo: return "Photos"
        case .game_photo: return "PS5 captures"
        case .game: return "Games"
        }
    }
    var symbol: String {
        switch self {
        case .photo: return "photo.on.rectangle.angled"
        case .game_photo: return "camera.viewfinder"
        case .game: return "gamecontroller.fill"
        }
    }
    /// Labels the one form reuses across all three kinds.
    var titleLabel: String {
        switch self {
        case .photo: return "Caption"
        case .game_photo: return "Caption"
        case .game: return "Game title"
        }
    }
    var subtitleLabel: String {
        switch self {
        case .photo: return "Where / when"
        case .game_photo: return "Which game"
        case .game: return "Platform"
        }
    }
    var storageFolder: String { "outside-of-work/\(rawValue)" }
}

enum GameStatus: String, Codable, CaseIterable, Identifiable {
    case playing, half_done, completed, backlog, wishlist
    var id: String { rawValue }
    var label: String {
        switch self {
        case .playing:   return "Playing"
        case .half_done: return "Half done"
        case .completed: return "Completed"
        case .backlog:   return "Backlog"
        case .wishlist:  return "Wishlist"
        }
    }
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
    /// Legacy column from the removed food tile; kept so old rows still decode.
    var rating: Int?
    var game_status: GameStatus?
    var is_published: Bool?
    var sort_order: Int?

    var published: Bool { is_published ?? true }
}

/// `GET /api/outside-of-work` returns the two halves already grouped.
struct OutsideOfWorkPayload: Codable {
    var photos: [OutsideItem]
    var gamePhotos: [OutsideItem]
    var games: [OutsideItem]

    var all: [OutsideItem] { photos + gamePhotos + games }

    func items(for kind: OutsideKind) -> [OutsideItem] {
        switch kind {
        case .photo: return photos
        case .game_photo: return gamePhotos
        case .game: return games
        }
    }
}

/// One result from `GET /api/games/search`.
struct GameHit: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let image: String?
    let released: String?
    let platforms: [String]
    let source: String

    /// "2020 · PlayStation 5" for the result row.
    var detail: String {
        [released?.prefix(4).description, platforms.prefix(3).joined(separator: ", ")]
            .compactMap { $0?.isEmpty == false ? $0 : nil }
            .joined(separator: " · ")
    }
}

struct GameSearchResponse: Decodable {
    var results: [GameHit]
    var note: String?
}
