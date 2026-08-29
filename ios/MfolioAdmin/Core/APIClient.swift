import Foundation

struct APIError: LocalizedError {
    let status: Int
    let message: String
    var errorDescription: String? { message }
}

/// Talks to the site's `/api`. Mirrors `src/lib/admin-fetch.ts` on the web:
/// every request carries the signed-in user's token, which `src/proxy.ts`
/// requires for writes and for the widened admin reads.
@MainActor
final class APIClient {
    private let auth: AuthStore
    init(auth: AuthStore) { self.auth = auth }

    private static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    func get<T: Decodable>(_ path: String, as type: T.Type) async throws -> T {
        let data = try await send(path, method: "GET", body: nil)
        return try decode(type, from: data)
    }

    @discardableResult
    func post(_ path: String, body: [String: Any?]) async throws -> Data {
        try await send(path, method: "POST", body: body)
    }

    @discardableResult
    func patch(_ path: String, body: [String: Any?]) async throws -> Data {
        try await send(path, method: "PATCH", body: body)
    }

    @discardableResult
    func delete(_ path: String) async throws -> Data {
        try await send(path, method: "DELETE", body: nil)
    }

    private func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do { return try Self.decoder.decode(type, from: data) }
        catch { throw APIError(status: -1, message: "Unexpected response from the server.") }
    }

    private func send(_ path: String, method: String, body: [String: Any?]?) async throws -> Data {
        guard let url = AppConfig.api(path) else {
            throw APIError(status: -1, message: "Bad URL for \(path).")
        }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("Bearer \(try await auth.validToken())", forHTTPHeaderField: "Authorization")

        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            // `null` has to survive into JSON — it is how a field gets cleared.
            let cleaned = body.mapValues { $0 ?? NSNull() }
            req.httpBody = try JSONSerialization.data(withJSONObject: cleaned)
        }

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError(status: -1, message: "No response from the server.")
        }
        guard (200..<300).contains(http.statusCode) else {
            throw APIError(status: http.statusCode, message: Self.serverMessage(data, http.statusCode))
        }
        return data
    }

    /// The API answers with `{ error }` or `{ message }`; surface that rather
    /// than a bare status code, since the guard's messages are actionable.
    ///
    /// The status-only fallbacks matter more than they look: a 404 or 405 here
    /// almost always means the server is running an older build that doesn't
    /// have the route yet, and "Request failed (404)" sends you hunting in the
    /// wrong place.
    private static func serverMessage(_ data: Data, _ status: Int) -> String {
        if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            if let e = obj["error"] as? String { return e }
            if let m = obj["message"] as? String { return m }
        }
        switch status {
        case 404, 405:
            return "This part of the API isn't on the server yet — deploy the latest site build."
        case 401:
            return "Your session expired. Sign out and back in."
        case 403:
            return "This account isn't on the admin allowlist."
        case 500...599:
            return "The server errored (\(status)). Check its logs."
        default:
            return "Request failed (\(status))."
        }
    }
}
