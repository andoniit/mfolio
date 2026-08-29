import Foundation

enum AuthError: LocalizedError {
    case notConfigured
    case badCredentials(String)
    case network(String)

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "Add your server details first."
        case .badCredentials(let m): return m
        case .network(let m): return m
        }
    }
}

/// Signs in against Supabase and keeps the access token fresh. The token is what
/// the site's `/api` guard checks, so every write in this app depends on it.
@MainActor
final class AuthStore: ObservableObject {
    @Published private(set) var email: String?
    @Published private(set) var isSignedIn = false
    @Published var isRestoring = true

    private var accessToken: String? {
        didSet { Keychain.set(accessToken, for: "access") }
    }
    private var refreshToken: String? {
        didSet { Keychain.set(refreshToken, for: "refresh") }
    }
    /// Refreshed a little early so a request never races the expiry.
    private var expiresAt: Date = .distantPast

    init() {
        accessToken = Keychain.get("access")
        refreshToken = Keychain.get("refresh")
        email = UserDefaults.standard.string(forKey: "auth.email")
    }

    func restore() async {
        defer { isRestoring = false }
        guard refreshToken != nil else { return }
        // Ask for a fresh token; if the refresh token has been revoked this
        // fails and we simply land on the sign-in screen.
        if (try? await refreshIfNeeded(force: true)) != nil {
            isSignedIn = true
        } else {
            signOut()
        }
    }

    func signIn(email address: String, password: String) async throws {
        guard let url = AppConfig.supabase("/auth/v1/token?grant_type=password") else {
            throw AuthError.notConfigured
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: [
            "email": address, "password": password,
        ])

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw AuthError.network("No response from Supabase.")
        }
        guard http.statusCode == 200 else {
            let msg = (try? JSONDecoder().decode(SupabaseAuthError.self, from: data))?.message
            throw AuthError.badCredentials(msg ?? "Could not sign in (\(http.statusCode)).")
        }

        let session = try JSONDecoder().decode(SupabaseSession.self, from: data)
        apply(session)
        email = address
        UserDefaults.standard.set(address, forKey: "auth.email")
        isSignedIn = true
    }

    func signOut() {
        accessToken = nil
        refreshToken = nil
        expiresAt = .distantPast
        isSignedIn = false
    }

    /// The session in the shape supabase-js keeps in `localStorage`, so the
    /// embedded web dashboard comes up already signed in instead of bouncing to
    /// its login screen. Key format is `sb-<project-ref>-auth-token`.
    func webSession() async throws -> (key: String, value: String) {
        let token = try await validToken()
        guard let refresh = refreshToken,
              let host = URL(string: AppConfig.supabaseURL)?.host,
              let ref = host.split(separator: ".").first
        else { throw AuthError.notConfigured }

        let payload: [String: Any] = [
            "access_token": token,
            "refresh_token": refresh,
            "token_type": "bearer",
            "expires_at": Int(expiresAt.timeIntervalSince1970),
            "expires_in": Int(max(expiresAt.timeIntervalSinceNow, 0)),
        ]
        let data = try JSONSerialization.data(withJSONObject: payload)
        return ("sb-\(ref)-auth-token", String(decoding: data, as: UTF8.self))
    }

    /// The bearer token for an API call, refreshing first if it is about to expire.
    func validToken() async throws -> String {
        try await refreshIfNeeded(force: false)
        guard let token = accessToken else { throw AuthError.badCredentials("Signed out.") }
        return token
    }

    @discardableResult
    private func refreshIfNeeded(force: Bool) async throws -> String {
        if !force, let token = accessToken, Date() < expiresAt { return token }
        guard let refresh = refreshToken,
              let url = AppConfig.supabase("/auth/v1/token?grant_type=refresh_token")
        else { throw AuthError.badCredentials("Signed out.") }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["refresh_token": refresh])

        let (data, response) = try await URLSession.shared.data(for: req)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            throw AuthError.badCredentials("Your session expired. Sign in again.")
        }
        let session = try JSONDecoder().decode(SupabaseSession.self, from: data)
        apply(session)
        return session.access_token
    }

    private func apply(_ session: SupabaseSession) {
        accessToken = session.access_token
        refreshToken = session.refresh_token
        expiresAt = Date().addingTimeInterval(TimeInterval(max(session.expires_in - 60, 30)))
    }
}

private struct SupabaseSession: Decodable {
    let access_token: String
    let refresh_token: String
    let expires_in: Int
}

private struct SupabaseAuthError: Decodable {
    let message: String?
    let error_description: String?

    private enum CodingKeys: String, CodingKey { case msg, message, error_description }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        // Supabase uses `msg` on some endpoints and `message` on others.
        message = (try? c.decode(String.self, forKey: .message))
            ?? (try? c.decode(String.self, forKey: .msg))
            ?? (try? c.decode(String.self, forKey: .error_description))
        error_description = nil
    }
}
