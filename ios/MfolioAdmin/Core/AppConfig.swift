import Foundation

/// Where the app points. Baked in on purpose — this is a single-user app for
/// one site, so there is no settings screen to get wrong.
///
/// None of these are secrets: the publishable key is the same one the website
/// already ships to every browser. The service-role key never comes near the
/// phone; every privileged write goes through the site's own API, which checks
/// the signed-in user against ADMIN_EMAILS.
///
/// Moving the site to a new domain means changing `siteURL` here and rebuilding.
enum AppConfig {
    /// The deployed site. No trailing slash.
    static let siteURL = "https://anikap.tech"

    static let supabaseURL = "https://vqonqepnkkoqayizugdd.supabase.co"

    /// Supabase *publishable* key (public by design).
    static let supabaseAnonKey = "sb_publishable_lQq59dO6c1tsdIA8ZZ5wyA_IpWrdCHm"

    /// Builds a URL against the site's API.
    static func api(_ path: String) -> URL? {
        URL(string: siteURL + path)
    }

    /// Builds a URL against Supabase directly (auth and storage only).
    static func supabase(_ path: String) -> URL? {
        URL(string: supabaseURL + path)
    }
}
