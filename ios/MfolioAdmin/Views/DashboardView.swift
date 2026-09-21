import SwiftUI

/// Home screen: the site at a glance, as cards.
///
/// Traffic leads, because it's the one number that changes on its own. Visitor
/// submissions waiting for review jump above it when there are any. Below that,
/// each part of the site is a card carrying its live count, and the places
/// without a number to show are smaller tool cards at the end.
struct DashboardView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var counts = DashboardCounts()
    @State private var countsError: String?
    @State private var loading = true
    @State private var traffic: TrafficCard.State = .loading

    private var reviewTotal: Int { counts.photoWallPending + counts.recommendationsPending }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    Text(Date.now.formatted(.dateTime.weekday(.wide).day().month(.wide)))
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                        .padding(.leading, 4)
                        .padding(.bottom, -10)

                    if reviewTotal > 0 {
                        ReviewCard(
                            photos: counts.photoWallPending,
                            notes: counts.recommendationsPending,
                            photosDestination: { PhotoWallView() },
                            notesDestination: { RecommendationsView() }
                        )
                    }

                    if let countsError {
                        CardSurface { ErrorCard(message: countsError) { Task { await loadCounts() } } }
                    }

                    NavigationLink { AnalyticsView() } label: { TrafficCard(state: traffic) }
                        .buttonStyle(CardPressStyle())

                    quickActions

                    cardSection("Content") {
                        stat(BlogView(), "doc.richtext.fill", Theme.Accent.blog, "Blog",
                             counts.postsLive, drafts(counts.postsDraft, else: "published"))
                        stat(ProjectsView(), "folder.fill", Theme.Accent.projects, "Projects",
                             counts.projectsLive, drafts(counts.projectsDraft, else: "published"))
                        stat(ExperienceView(category: "work", title: "Experience"),
                             "briefcase.fill", Theme.Accent.experience, "Experience",
                             counts.workLive, counts.workLive == 1 ? "role" : "roles")
                        stat(ExperienceView(category: "volunteer", title: "Voluntary Roles"),
                             "heart.fill", Theme.Accent.volunteer, "Voluntary",
                             counts.volunteerLive, counts.volunteerLive == 1 ? "role" : "roles")
                    }

                    cardSection("Home page") {
                        stat(PhotoWallView(), "camera.fill", Theme.Accent.photoWall, "Photo Wall",
                             counts.photoWallLive, pending(counts.photoWallPending),
                             badge: counts.photoWallPending)
                        stat(RecommendationsView(), "quote.bubble.fill", Theme.Accent.recommendations,
                             "Recommendations", counts.recommendationsLive,
                             pending(counts.recommendationsPending),
                             badge: counts.recommendationsPending)
                    } footer: {
                        // Three cards in a two-column grid would strand one; this
                        // one spans the width instead.
                        stat(OutsideOfWorkView(), "square.grid.2x2.fill", Theme.Accent.outside,
                             "Outside of Work", counts.outsideLive,
                             counts.outsideHidden > 0 ? "live · \(counts.outsideHidden) hidden" : "live",
                             wide: true)
                    }

                    cardSection("Tools") {
                        tool(NewsletterView(), "envelope.fill", Theme.Accent.newsletter, "Newsletter", "Subscribers")
                        tool(ResumeView(), "doc.fill", Theme.Accent.resume, "Resume", "What's live")
                        tool(TaxonomyView(kind: .categories), "folder.badge.gearshape",
                             Theme.Accent.categories, "Categories", "For posts")
                        tool(TaxonomyView(kind: .tags), "tag.fill", Theme.Accent.tags, "Tags", "For posts")
                        tool(WebEditorView(path: "/admin/seo", title: "SEO Tools"),
                             "magnifyingglass", .gray, "SEO Tools", "On the web")
                        tool(WebEditorView(path: "/admin", title: "Web dashboard"),
                             "safari.fill", Theme.Accent.web, "Web admin", "On the web")
                    }
                }
                .padding(.horizontal, Theme.gutter)
                .padding(.bottom, 32)
                // Placeholder shapes on first load, rather than a grid of zeros
                // that reads as "the site is empty".
                .redacted(reason: loading && counts.isEmpty ? .placeholder : [])
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(greeting)
            .toolbar { accountMenu }
            .refreshable { await load() }
            .task { await load() }
        }
    }

    // MARK: - Pieces

    private var quickActions: some View {
        HStack(spacing: CardStyle.spacing) {
            NavigationLink {
                PostEditorView(postID: nil) { Task { await loadCounts() } }
            } label: {
                QuickActionLabel(icon: "square.and.pencil", title: "New post", tint: .accentColor)
            }
            if let site = URL(string: AppConfig.siteURL) {
                Link(destination: site) {
                    QuickActionLabel(icon: "arrow.up.right.square", title: "View site", tint: .accentColor)
                }
            }
        }
        .buttonStyle(CardPressStyle())
    }

    private var accountMenu: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                if let email = auth.email {
                    Section("Signed in as \(email)") {}
                }
                Button(role: .destructive) { auth.signOut() } label: {
                    Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                }
            } label: {
                Image(systemName: "person.crop.circle")
                    .font(.title3)
            }
            .accessibilityLabel("Account")
        }
    }

    private func cardSection<Content: View>(_ title: String, @ViewBuilder cards: () -> Content) -> some View {
        cardSection(title, cards: cards) { EmptyView() }
    }

    /// `footer` holds full-width cards under the grid.
    private func cardSection<Content: View, Footer: View>(
        _ title: String,
        @ViewBuilder cards: () -> Content,
        @ViewBuilder footer: () -> Footer
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            CardSectionHeader(title: title)
            LazyVGrid(columns: CardStyle.grid, spacing: CardStyle.spacing) { cards() }
            footer().padding(.top, CardStyle.spacing - 8)
        }
    }

    private func stat<D: View>(_ destination: D, _ icon: String, _ tint: Color, _ title: String,
                               _ value: Int, _ detail: String, badge: Int = 0, wide: Bool = false) -> some View {
        NavigationLink { destination } label: {
            StatCard(icon: icon, tint: tint, title: title, value: value, detail: detail,
                     badge: badge, wide: wide)
        }
        .buttonStyle(CardPressStyle())
    }

    private func tool<D: View>(_ destination: D, _ icon: String, _ tint: Color,
                               _ title: String, _ detail: String?) -> some View {
        NavigationLink { destination } label: {
            ToolCard(icon: icon, tint: tint, title: title, detail: detail)
        }
        .buttonStyle(CardPressStyle())
    }

    private func drafts(_ n: Int, else fallback: String) -> String {
        n > 0 ? "\(fallback) · \(n) draft\(n == 1 ? "" : "s")" : fallback
    }

    private func pending(_ n: Int) -> String {
        n > 0 ? "live · \(n) to review" : "live"
    }

    private var greeting: String {
        switch Calendar.current.component(.hour, from: .now) {
        case 5..<12: "Good morning"
        case 12..<17: "Good afternoon"
        default: "Good evening"
        }
    }

    // MARK: - Loading

    /// Counts and traffic load side by side and land independently: the
    /// counts come from the site's own database and are quick, while traffic
    /// waits on Google — it shouldn't hold the rest of the screen back.
    private func load() async {
        async let c: Void = loadCounts()
        async let t: Void = loadTraffic()
        _ = await (c, t)
    }

    /// One request for every number on the cards — see /api/admin/summary.
    private func loadCounts() async {
        loading = true
        do {
            counts = try await APIClient(auth: auth).get("/api/admin/summary", as: DashboardCounts.self)
            countsError = nil
        } catch {
            countsError = error.localizedDescription
        }
        loading = false
    }

    private func loadTraffic() async {
        do {
            let snap = try await APIClient(auth: auth)
                .get("/api/admin/analytics?days=7", as: AnalyticsSnapshot.self)
            traffic = snap.configured ? .ready(snap) : .notConnected
        } catch {
            // Keep what's on screen if a refresh fails; only the first load
            // falls back to the failure message.
            if case .loading = traffic { traffic = .failed }
        }
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
