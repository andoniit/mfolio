import Foundation

/// Uploads an already-optimised image to Supabase Storage with the signed-in
/// user's token, the same way the web admin does — storage policies allow
/// `authenticated` writes, so no service-role key ever touches the phone.
///
/// Shrinking happens in `ImageOptimizer` before this is called, so what goes
/// over the wire is bounded in size and carries no camera metadata.
@MainActor
enum ImageUploader {
    struct Uploaded {
        let publicURL: String
        let storagePath: String
    }

    static func upload(
        _ image: ImageOptimizer.Optimized,
        bucket: String = "blog-images",
        folder: String,
        auth: AuthStore
    ) async throws -> Uploaded {
        let name = "\(Int(Date().timeIntervalSince1970 * 1000))-\(UUID().uuidString.prefix(8)).\(image.fileExtension)"
        let path = "\(folder)/\(name)"

        guard let url = AppConfig.supabase("/storage/v1/object/\(bucket)/\(path)") else {
            throw APIError(status: -1, message: "Bad storage URL.")
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("Bearer \(try await auth.validToken())", forHTTPHeaderField: "Authorization")
        req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.setValue(image.contentType, forHTTPHeaderField: "Content-Type")
        req.setValue("31536000", forHTTPHeaderField: "cache-control")

        let (respData, response) = try await URLSession.shared.upload(for: req, from: image.data)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            let detail = (try? JSONSerialization.jsonObject(with: respData) as? [String: Any])?["message"] as? String
            throw APIError(status: status, message: detail ?? "Upload failed (\(status)).")
        }

        return Uploaded(
            publicURL: "\(AppConfig.supabaseURL)/storage/v1/object/public/\(bucket)/\(path)",
            storagePath: path
        )
    }
}
