import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var counts = DashboardCounts()
    @State private var failures: [String] = []
    @State private var loading = true

    private var reviewTotal: Int { counts.photoWallPending + counts.recommendationsPending }

    var body: some View {
        NavigationStack {
            List {
                if reviewTotal > 0 {
                    Section { reviewBanner }
                        .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                        .listRowBackground(Color.clear)
                }

                if !failures.isEmpty {
                    Section {
                        ErrorCard(
                            message: failures.count == 1
                                ? failures[0]
                                : "\(failures.count) sections failed to load. \(failures[0])",
                            retry: { Task { await load() } }
                        )
                    }
                }

                Section("Home page") {
                    link(OutsideOfWorkView(), "square.grid.2x2.fill", Theme.Accent.outside,
                         "Outside of Work", counts.outsideText)
                    link(PhotoWallView(), "camera.fill", Theme.Accent.photoWall,
                         "Photo Wall", counts.photoWallText, counts.photoWallPending)
                    link(RecommendationsView(), "quote.bubble.fill", Theme.Accent.recommendations,
                         "Recommendations", counts.recommendationsText, counts.recommendationsPending)
                }

                Section("Content") {
                    link(BlogView(), "doc.richtext.fill", Theme.Accent.blog, "Blog", counts.postsText)
                    link(ProjectsView(), "folder.fill", Theme.Accent.projects, "Projects", counts.projectsText)
                    link(ExperienceView(category: "work", title: "Experience"),
                         "briefcase.fill", Theme.Accent.experience, "Experience", counts.experienceText)
                    link(ExperienceView(category: "volunteer", title: "Voluntary Roles"),
                         "heart.fill", Theme.Accent.volunteer, "Voluntary Roles", counts.volunteerText)
                }

                Section("Organise") {
                    link(TaxonomyView(kind: .categories), "folder.badge.gearshape",
                         Theme.Accent.categories, "Categories", "")
                    link(TaxonomyView(kind: .tags), "tag.fill", Theme.Accent.tags, "Tags", "")
                }

                Section("Site") {
                    link(NewsletterView(), "envelope.fill", Theme.Accent.newsletter, "Newsletter", "")
                    link(ResumeView(), "doc.fill", Theme.Accent.resume, "Resume", "")
                    link(WebEditorView(path: "/admin/seo", title: "SEO Tools"),
                         "magnifyingglass", .secondary, "SEO Tools", "Opens on the web")
                    link(WebEditorView(path: "/admin", title: "Web dashboard"),
                         "safari.fill", Theme.Accent.web, "Web dashboard", "")
                }

                Section {
                    Button("Sign out", role: .destructive) { auth.signOut() }
                } footer: {
                    if let email = auth.email {
                        Text("Signed in as \(email)")
                    }
                }
            }
            .navigationTitle("Dashboard")
            .overlay { if loading && counts.isEmpty { ProgressView() } }
            .refreshable { await load() }
            .task { await load() }
        }
    }

    /// The one thing worth surfacing above everything else: visitor
    /// submissions sitting unreviewed.
    private var reviewBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "tray.full.fill")
                .font(.title3)
                .foregroundStyle(.white)
                .frame(width: 40, height: 40)
                .background(
                    LinearGradient(colors: [.orange, .pink],
                                   startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                )
            VStack(alignment: .leading, spacing: 2) {
                Text("\(reviewTotal) waiting for review").font(.subheadline.weight(.semibold))
                Text(reviewDetail).font(.caption).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .background(Color(.secondarySystemGroupedBackground),
                    in: RoundedRectangle(cornerRadius: Theme.corner, style: .continuous))
    }

    private var reviewDetail: String {
        var parts: [String] = []
        if counts.photoWallPending > 0 { parts.append("\(counts.photoWallPending) on the photo wall") }
        if counts.recommendationsPending > 0 { parts.append("\(counts.recommendationsPending) recommendation\(counts.recommendationsPending == 1 ? "" : "s")") }
        return parts.joined(separator: " · ")
    }

    private func link<D: View>(_ destination: D, _ icon: String, _ tint: Color,
                               _ title: String, _ detail: String, _ badge: Int = 0) -> some View {
        NavigationLink { destination } label: {
            HStack(spacing: 12) {
                GlyphTile(icon: icon, tint: tint)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                    if !detail.isEmpty {
                        Text(detail).font(.caption).foregroundStyle(.secondary)
                    }
                }
                if badge > 0 {
                    Spacer(minLength: 0)
                    CountBadge(value: badge)
                }
            }
            .padding(.vertical, 2)
        }
    }

    /// One request for every number on this screen.
    ///
    /// This used to fan out to seven list endpoints and count rows on the
    /// phone, which meant pulling whole blog posts and base64 avatars over the
    /// wire — ~176KB and seven token checks — to show a handful of counts.
    private func load() async {
        loading = true
        do {
            counts = try await APIClient(auth: auth)
                .get("/api/admin/summary", as: DashboardCounts.self)
            failures = []
        } catch {
            failures = [error.localizedDescription]
        }
        loading = false
    }
}

struct DashboardCounts: Decodable {
    var outsideLive = 0, outsideHidden = 0
    var photoWallPending = 0, photoWallLive = 0
    var recommendationsPending = 0, recommendationsLive = 0
    var projectsLive = 0, projectsDraft = 0
    var postsLive = 0, postsDraft = 0
    var workLive = 0, volunteerLive = 0

    /// Distinguishes "not loaded yet" from "everything really is zero", so the
    /// spinner shows on first load but not on a genuinely empty site.
    var isEmpty = true

    init() {}

    private enum CodingKeys: String, CodingKey {
        case outsideLive, outsideHidden, photoWallPending, photoWallLive
        case recommendationsPending, recommendationsLive
        case projectsLive, projectsDraft, postsLive, postsDraft
        case workLive, volunteerLive
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        func v(_ k: CodingKeys) -> Int { (try? c.decode(Int.self, forKey: k)) ?? 0 }
        outsideLive = v(.outsideLive);            outsideHidden = v(.outsideHidden)
        photoWallPending = v(.photoWallPending);  photoWallLive = v(.photoWallLive)
        recommendationsPending = v(.recommendationsPending)
        recommendationsLive = v(.recommendationsLive)
        projectsLive = v(.projectsLive);          projectsDraft = v(.projectsDraft)
        postsLive = v(.postsLive);                postsDraft = v(.postsDraft)
        workLive = v(.workLive);                  volunteerLive = v(.volunteerLive)
        isEmpty = false
    }

    var outsideText: String { "\(outsideLive) live" + (outsideHidden > 0 ? " · \(outsideHidden) hidden" : "") }
    var photoWallText: String { "\(photoWallLive) live" + (photoWallPending > 0 ? " · \(photoWallPending) to review" : "") }
    var recommendationsText: String { "\(recommendationsLive) live" + (recommendationsPending > 0 ? " · \(recommendationsPending) to review" : "") }
    var projectsText: String { "\(projectsLive) published" + (projectsDraft > 0 ? " · \(projectsDraft) draft" : "") }
    var postsText: String { "\(postsLive) published" + (postsDraft > 0 ? " · \(postsDraft) draft" : "") }
    var experienceText: String { "\(workLive) role\(workLive == 1 ? "" : "s")" }
    var volunteerText: String { "\(volunteerLive) role\(volunteerLive == 1 ? "" : "s")" }
}
