import Foundation
import ImageIO
import UniformTypeIdentifiers
import CoreGraphics

/// Shrinks a photo straight off the camera roll before it is uploaded.
///
/// Two things matter here and neither is handled by `UIImage(data:)` +
/// `jpegData`:
///
/// 1. **Memory.** Decoding a 48MP photo into a `UIImage` inflates to ~190MB of
///    bitmap before any resizing happens. `CGImageSourceCreateThumbnailAtIndex`
///    decodes *directly* at the target size, so the full-resolution bitmap
///    never exists.
/// 2. **Actual pixel size.** `UIGraphicsImageRenderer(size:)` works in points
///    and defaults to the screen scale, so a "1600" cap silently produced a
///    4800px image on a 3x device. ImageIO's cap is in real pixels.
///
/// Re-encoding through a fresh `CGImageDestination` with no metadata attached
/// also drops the camera's metadata — including the GPS coordinates iPhone
/// photos carry, which would otherwise be published to a public bucket. (ImageIO
/// still writes a minimal synthesized EXIF block holding ColorSpace and the
/// pixel dimensions; there is no camera, timestamp or location data in it.)
enum ImageOptimizer {
    /// Nothing on the site renders an image wider than this.
    static let defaultMaxPixel: CGFloat = 1600
    /// Target upload size. Comfortably under it for a typical photo.
    static let defaultBudget = 900_000

    struct Optimized {
        let data: Data
        let pixelSize: CGSize
        let originalBytes: Int
        /// True when alpha forced a PNG instead of a JPEG.
        var isPNG: Bool = false
        var bytes: Int { data.count }

        var contentType: String { isPNG ? "image/png" : "image/jpeg" }
        var fileExtension: String { isPNG ? "png" : "jpg" }

        /// "3.8 MB → 412 KB", for showing the person what happened.
        var summary: String {
            let f = ByteCountFormatter()
            f.countStyle = .file
            return "\(f.string(fromByteCount: Int64(originalBytes))) → \(f.string(fromByteCount: Int64(bytes)))"
        }

        var didShrink: Bool { bytes < originalBytes }
    }

    /// Ladder of attempts: keep the full cap and drop quality first, since
    /// resolution is more visible than mild JPEG artefacting. Only shrink the
    /// dimensions if quality alone can't get under budget.
    private static let qualitySteps: [CGFloat] = [0.82, 0.7, 0.58, 0.45]

    /// Don't chase a target below this. A small original shouldn't force
    /// needless quality loss just to come in under its own byte count.
    private static let budgetFloor = 250_000

    static func optimize(
        _ source: Data,
        maxPixel: CGFloat = defaultMaxPixel,
        budget: Int = defaultBudget
    ) -> Optimized? {
        let options = [kCGImageSourceShouldCache: false] as CFDictionary
        guard let src = CGImageSourceCreateWithData(source as CFData, options) else { return nil }

        // Re-encoding an already well-compressed image at high quality can come
        // out *larger* than the original, which defeats the point. Treat the
        // original's size as a ceiling too.
        let target = min(budget, max(source.count, budgetFloor))

        // A transparent source (a logo, say) would gain a black background if
        // it were flattened into JPEG, so those keep their alpha as PNG. Photos
        // never take this path.
        if hasAlpha(src), let image = thumbnail(from: src, maxPixel: maxPixel),
           let png = encodePNG(image) {
            return Optimized(
                data: png,
                pixelSize: CGSize(width: image.width, height: image.height),
                originalBytes: source.count,
                isPNG: true
            )
        }

        var smallest: Optimized?

        for cap in [maxPixel, maxPixel * 0.75, maxPixel * 0.5] {
            guard let image = thumbnail(from: src, maxPixel: cap) else { continue }
            let size = CGSize(width: image.width, height: image.height)

            for quality in qualitySteps {
                guard let data = encodeJPEG(image, quality: quality) else { continue }
                let candidate = Optimized(data: data, pixelSize: size, originalBytes: source.count)

                if data.count <= target { return candidate }
                if smallest == nil || data.count < smallest!.bytes { smallest = candidate }
            }
        }

        // Everything overshot the budget — hand back the smallest we produced
        // rather than failing, since an oversized upload beats no upload.
        return smallest
    }

    /// Decodes at the target size. `kCGImageSourceCreateThumbnailWithTransform`
    /// bakes in the EXIF orientation, so a photo shot sideways doesn't upload
    /// rotated once the metadata is stripped.
    private static func thumbnail(from src: CGImageSource, maxPixel: CGFloat) -> CGImage? {
        let opts: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: max(1, maxPixel.rounded()),
            kCGImageSourceShouldCacheImmediately: true,
        ]
        return CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary)
    }

    private static func hasAlpha(_ src: CGImageSource) -> Bool {
        guard let p = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any] else {
            return false
        }
        return (p[kCGImagePropertyHasAlpha] as? Bool) == true
    }

    private static func encodePNG(_ image: CGImage) -> Data? {
        let out = NSMutableData()
        guard let dest = CGImageDestinationCreateWithData(
            out, UTType.png.identifier as CFString, 1, nil
        ) else { return nil }
        CGImageDestinationAddImage(dest, image, nil)
        guard CGImageDestinationFinalize(dest) else { return nil }
        return out as Data
    }

    private static func encodeJPEG(_ image: CGImage, quality: CGFloat) -> Data? {
        let out = NSMutableData()
        guard let dest = CGImageDestinationCreateWithData(
            out, UTType.jpeg.identifier as CFString, 1, nil
        ) else { return nil }

        // Only the compression setting is passed — no metadata dictionary, so
        // EXIF/GPS from the original does not survive.
        CGImageDestinationAddImage(
            dest, image,
            [kCGImageDestinationLossyCompressionQuality: quality] as CFDictionary
        )
        guard CGImageDestinationFinalize(dest) else { return nil }
        return out as Data
    }
}
