import Foundation

/// A project as `GET /api/projects/:id` returns it — the full row plus its
/// gallery, in the order the site shows it.
struct ProjectDetail: Decodable {
    let id: String
    var title: String
    var slug: String?
    var description: String?
    var external_url: String?
    var home_feature_order: Int?
    var content_json: JSONValue?
    var content_html: String?
    var tech_stack: [String]?
    var collaborators: [String]?
    var workplace: String?
    var client_name: String?
    var project_date: String?
    var cover_image_url: String?
    var published: Bool?
    var trashed_at: String?
    var gallery_images: [GalleryRow]?

    struct GalleryRow: Decodable {
        var image_url: String
        var alt_text: String?
    }
}

/// One gallery image. The id only exists so SwiftUI can track rows while you
/// reorder them; it never goes to the server.
struct GalleryImage: Codable, Hashable, Identifiable {
    var id = UUID()
    var url: String
    var alt: String
}

/// Everything about a project except its body — the same fields as the web
/// form's sidebar. Plain values throughout, so `==` means "something changed",
/// which drives the unsaved-changes guard.
struct ProjectMeta: Codable, Hashable {
    var title = ""
    var slug = ""
    /// Hand-edited slugs stop following the title, as for posts.
    var slugTouched = false
    var description = ""
    var externalURL = ""
    var workplace = ""
    var clientName = ""
    /// `yyyy-MM-dd`, the project's own date. It orders the projects page and,
    /// on first publish, becomes the publish date.
    var projectDay = PostMeta.today
    var published = false
    /// 1–4 places the project on the home page; nil leaves it off.
    var homeSlot: Int?
    var coverImageURL: String?
    var techStack: [String] = []
    var collaborators: [String] = []
    var gallery: [GalleryImage] = []

    init() {}

    init(_ p: ProjectDetail) {
        title = p.title
        slug = p.slug ?? ""
        slugTouched = true
        description = p.description ?? ""
        externalURL = p.external_url ?? ""
        workplace = p.workplace ?? ""
        clientName = p.client_name ?? ""
        projectDay = PostMeta.day(fromISO: p.project_date) ?? PostMeta.today
        published = p.published ?? false
        homeSlot = p.home_feature_order
        coverImageURL = p.cover_image_url.flatMap { $0.isEmpty ? nil : $0 }
        techStack = p.tech_stack ?? []
        collaborators = p.collaborators ?? []
        gallery = (p.gallery_images ?? []).map { GalleryImage(url: $0.image_url, alt: $0.alt_text ?? "") }
    }

    /// Derived from the name until typed by hand — see `PostMeta.resolvedSlug`.
    var resolvedSlug: String { slugTouched ? slug : PostMeta.slugify(title) }

    /// The project link as the server will accept it — see `WebLink`.
    func normalizedLink() throws -> String? {
        try WebLink.normalize(externalURL, field: "The project link")
    }
}

/// The server's rule for links (projects, companies): blank, or an http(s)
/// URL. Applied here too so a bad link is caught before the round trip.
enum WebLink {
    /// A bare domain gets `https://`; anything else that isn't a web address
    /// throws, naming `field` in the message.
    static func normalize(_ raw: String, field: String) throws -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let candidate = trimmed.contains("://") ? trimmed : "https://" + trimmed
        // URL(string:) quietly percent-encodes spaces since iOS 17, so
        // "my site" would pass here and fail on the server. Refuse it up front.
        guard !candidate.contains(where: \.isWhitespace),
              let url = URL(string: candidate), let scheme = url.scheme?.lowercased(),
              scheme == "http" || scheme == "https", url.host?.isEmpty == false
        else {
            throw APIError(status: -1, message: "\(field) must be a web address (https://…).")
        }
        return candidate
    }

    /// Whether `raw` would be refused — for inline hints under a field.
    static func isInvalid(_ raw: String) -> Bool {
        (try? normalize(raw, field: "")) == nil && !raw.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}
