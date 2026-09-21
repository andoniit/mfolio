import Foundation

/// A post as `GET /api/posts/:id` returns it — the full row plus its tag ids.
struct PostDetail: Decodable {
    let id: String
    var title: String
    var slug: String?
    var excerpt: String?
    var cover_image_url: String?
    var published: Bool?
    var published_at: String?
    var category_id: String?
    var content_json: JSONValue?
    var content_html: String?
    var tag_ids: [String]?
    var trashed_at: String?
}

/// Just enough of the created row to switch the editor from POST to PUT.
struct CreatedPost: Decodable {
    let id: String
    var slug: String?
}

/// Everything about a post except its body, which lives in the editor.
///
/// Kept as plain values — a day string rather than a `Date`, a set rather
/// than an ordered list — so `==` means "the person changed something" and
/// nothing else. That comparison drives the unsaved-changes guard.
struct PostMeta: Codable, Hashable {
    var title = ""
    var slug = ""
    /// Once the slug is typed by hand it stops following the title — a live
    /// URL changing because a typo got fixed would break links.
    var slugTouched = false
    var excerpt = ""
    var coverImageURL: String?
    var published = false
    /// `yyyy-MM-dd`. The web stores publish dates as noon UTC on this day.
    var publishDay = PostMeta.today
    var categoryID: String?
    var tagIDs: Set<String> = []

    init() {}

    init(_ post: PostDetail) {
        title = post.title
        slug = post.slug ?? ""
        slugTouched = true
        excerpt = post.excerpt ?? ""
        coverImageURL = post.cover_image_url.flatMap { $0.isEmpty ? nil : $0 }
        published = post.published ?? false
        publishDay = PostMeta.day(fromISO: post.published_at) ?? PostMeta.today
        categoryID = post.category_id.flatMap { $0.isEmpty ? nil : $0 }
        tagIDs = Set(post.tag_ids ?? [])
    }

    /// The slug to show and save. Until it's typed by hand it *is* the title,
    /// slugified — derived on read rather than copied on every keystroke, since
    /// a copy can miss the last one (it did, when focus left the title field
    /// straight after typing).
    var resolvedSlug: String { slugTouched ? slug : PostMeta.slugify(title) }

    /// The same timestamp BlogForm.tsx writes, so the two editors agree.
    var publishedAtISO: String? { published ? "\(publishDay)T12:00:00.000Z" : nil }

    static var today: String { dayFormatter(utc: false).string(from: Date()) }

    /// The UTC calendar day of a stored timestamp — what the web form shows.
    static func day(fromISO iso: String?) -> String? {
        guard let iso, iso.count >= 10 else { return nil }
        let day = String(iso.prefix(10))
        return dayFormatter(utc: true).date(from: day) == nil ? nil : day
    }

    static func dayFormatter(utc: Bool) -> DateFormatter {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = utc ? TimeZone(secondsFromGMT: 0) : .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }

    /// `slugify(title, { lower: true, strict: true })`, near enough: ASCII
    /// letters and digits, everything else collapsed to single hyphens.
    static func slugify(_ text: String) -> String {
        let folded = text
            .replacingOccurrences(of: "&", with: " and ")
            .folding(options: [.diacriticInsensitive, .widthInsensitive], locale: Locale(identifier: "en_US"))
            .lowercased()
        var slug = ""
        var pendingDash = false
        for scalar in folded.unicodeScalars {
            if scalar.isASCII, CharacterSet.alphanumerics.contains(scalar) {
                if pendingDash && !slug.isEmpty { slug.append("-") }
                slug.unicodeScalars.append(scalar)
                pendingDash = false
            } else {
                pendingDash = true
            }
        }
        return slug
    }
}

/// Arbitrary JSON, for TipTap documents. The app never looks inside one — it
/// only carries it between the API, the editor and the local draft file, so a
/// faithful value type is all that's needed.
enum JSONValue: Codable, Equatable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null }
        else if let v = try? c.decode(Bool.self) { self = .bool(v) }
        else if let v = try? c.decode(Double.self) { self = .number(v) }
        else if let v = try? c.decode(String.self) { self = .string(v) }
        else if let v = try? c.decode([JSONValue].self) { self = .array(v) }
        else { self = .object(try c.decode([String: JSONValue].self)) }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .null: try c.encodeNil()
        case .bool(let v): try c.encode(v)
        case .number(let v): try c.encode(v)
        case .string(let v): try c.encode(v)
        case .array(let v): try c.encode(v)
        case .object(let v): try c.encode(v)
        }
    }

    /// Foundation form, for `JSONSerialization` bodies and for handing to
    /// WebKit, which bridges these straight into JavaScript values.
    var foundation: Any {
        switch self {
        case .null: NSNull()
        case .bool(let v): v
        // Whole numbers go over as integers: `level: 2`, not `level: 2.0`.
        case .number(let v): v.rounded() == v && abs(v) < 1e15 ? Int(v) as Any : v as Any
        case .string(let v): v
        case .array(let v): v.map(\.foundation)
        case .object(let v): v.mapValues(\.foundation)
        }
    }

    init(foundation value: Any) {
        switch value {
        case is NSNull: self = .null
        case let v as NSNumber where CFGetTypeID(v) == CFBooleanGetTypeID(): self = .bool(v.boolValue)
        case let v as NSNumber: self = .number(v.doubleValue)
        case let v as String: self = .string(v)
        case let v as [Any]: self = .array(v.map(JSONValue.init(foundation:)))
        case let v as [String: Any]: self = .object(v.mapValues(JSONValue.init(foundation:)))
        default: self = .null
        }
    }
}

/// Crash insurance for the one screen where losing work really hurts.
///
/// The editor writes its state here a couple of seconds after each change, and
/// clears it on a successful save. If the app dies mid-post — or you back out
/// and change your mind — the next open offers the draft back.
enum LocalDraftStore {
    /// `Meta` is whatever the editor keeps beside the body — post settings,
    /// project details.
    struct Draft<Meta: Codable>: Codable {
        var meta: Meta
        var content: JSONValue?
        var savedAt: Date
    }

    /// One slot per post, plus one shared slot for the post not created yet.
    static func key(for postID: String?) -> String { postID ?? "new" }

    /// Projects get their own namespace, so a project and a post can never
    /// land in the same slot.
    static func projectKey(for projectID: String?) -> String { "project-\(projectID ?? "new")" }

    private static var folder: URL? {
        guard let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
            return nil
        }
        let dir = base.appendingPathComponent("PostDrafts", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    private static func url(_ key: String) -> URL? {
        // Post ids are UUIDs; anything else is refused rather than used as a path.
        guard key.range(of: #"^[A-Za-z0-9-]{1,80}$"#, options: .regularExpression) != nil else {
            return nil
        }
        return folder?.appendingPathComponent("\(key).json")
    }

    static func load<Meta: Codable>(_ key: String, as _: Meta.Type) -> Draft<Meta>? {
        guard let url = url(key), let data = try? Data(contentsOf: url) else { return nil }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try? decoder.decode(Draft<Meta>.self, from: data)
    }

    static func save<Meta: Codable>(_ draft: Draft<Meta>, _ key: String) {
        guard let url = url(key) else { return }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        guard let data = try? encoder.encode(draft) else { return }
        // Complete-until-first-unlock: readable in the background after the
        // first unlock, encrypted at rest before it.
        try? data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }

    static func clear(_ key: String) {
        guard let url = url(key) else { return }
        try? FileManager.default.removeItem(at: url)
    }
}
