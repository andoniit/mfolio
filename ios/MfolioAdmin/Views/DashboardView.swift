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

    /// Each count is fetched independently: one section being unavailable
    /// (an endpoint not deployed yet, say) must not blank the whole dashboard.
    private func load() async {
        loading = true
        let api = APIClient(auth: auth)
        var problems: [String] = []
        var next = DashboardCounts()

        async let outside = Self.attempt { try await api.get("/api/outside-of-work?all=1", as: OutsideOfWorkPayload.self).all }
        async let wall = Self.attempt { try await api.get("/api/photo-wall?status=all", as: [PhotoWallPost].self) }
        async let recs = Self.attempt { try await api.get("/api/recommendations?status=all", as: [Recommendation].self) }
        async let projects = Self.attempt { try await api.get("/api/projects?all=1&limit=200", as: [ProjectSummary].self) }
        async let posts = Self.attempt { try await api.get("/api/posts?all=1", as: [BlogPost].self) }
        async let work = Self.attempt { try await api.get("/api/experiences?all=1&category=work&limit=200", as: [ExperienceItem].self) }
        async let volunteer = Self.attempt { try await api.get("/api/experiences?all=1&category=volunteer&limit=200", as: [ExperienceItem].self) }

        switch await outside {
        case .success(let v): next.setOutside(v)
        case .failure(let e): problems.append("Outside of Work: \(e.localizedDescription)")
        }
        switch await wall {
        case .success(let v): next.setWall(v)
        case .failure(let e): problems.append("Photo Wall: \(e.localizedDescription)")
        }
        switch await recs {
        case .success(let v): next.setRecommendations(v)
        case .failure(let e): problems.append("Recommendations: \(e.localizedDescription)")
        }
        switch await projects {
        case .success(let v): next.setProjects(v)
        case .failure(let e): problems.append("Projects: \(e.localizedDescription)")
        }
        switch await posts {
        case .success(let v): next.setPosts(v)
        case .failure(let e): problems.append("Blog: \(e.localizedDescription)")
        }
        switch await work {
        case .success(let v): next.setWork(v)
        case .failure(let e): problems.append("Experience: \(e.localizedDescription)")
        }
        switch await volunteer {
        case .success(let v): next.setVolunteer(v)
        case .failure(let e): problems.append("Voluntary Roles: \(e.localizedDescription)")
        }

        counts = next
        failures = problems
        loading = false
    }

    private static func attempt<T>(_ work: @escaping () async throws -> T) async -> Result<T, Error> {
        do { return .success(try await work()) } catch { return .failure(error) }
    }
}

struct DashboardCounts {
    var outsideLive = 0, outsideHidden = 0
    var photoWallPending = 0, photoWallLive = 0
    var recommendationsPending = 0, recommendationsLive = 0
    var projectsLive = 0, projectsDraft = 0
    var postsLive = 0, postsDraft = 0
    var workLive = 0, volunteerLive = 0
    private(set) var loadedAnything = false

    var isEmpty: Bool { !loadedAnything }

    mutating func setOutside(_ v: [OutsideItem]) {
        outsideLive = v.filter(\.published).count
        outsideHidden = v.count - outsideLive
        loadedAnything = true
    }
    mutating func setWall(_ v: [PhotoWallPost]) {
        photoWallPending = v.filter { $0.state == .pending }.count
        photoWallLive = v.filter { $0.state == .approved }.count
        loadedAnything = true
    }
    mutating func setRecommendations(_ v: [Recommendation]) {
        recommendationsPending = v.filter { $0.state == .pending }.count
        recommendationsLive = v.filter { $0.state == .approved }.count
        loadedAnything = true
    }
    mutating func setProjects(_ v: [ProjectSummary]) {
        let live = v.filter { !$0.isTrashed }
        projectsLive = live.filter(\.isPublished).count
        projectsDraft = live.count - projectsLive
        loadedAnything = true
    }
    mutating func setPosts(_ v: [BlogPost]) {
        let live = v.filter { !$0.isTrashed }
        postsLive = live.filter(\.isPublished).count
        postsDraft = live.count - postsLive
        loadedAnything = true
    }
    mutating func setWork(_ v: [ExperienceItem]) {
        workLive = v.filter { !$0.isTrashed }.count
        loadedAnything = true
    }
    mutating func setVolunteer(_ v: [ExperienceItem]) {
        volunteerLive = v.filter { !$0.isTrashed }.count
        loadedAnything = true
    }

    var outsideText: String { "\(outsideLive) live" + (outsideHidden > 0 ? " · \(outsideHidden) hidden" : "") }
    var photoWallText: String { "\(photoWallLive) live" + (photoWallPending > 0 ? " · \(photoWallPending) to review" : "") }
    var recommendationsText: String { "\(recommendationsLive) live" + (recommendationsPending > 0 ? " · \(recommendationsPending) to review" : "") }
    var projectsText: String { "\(projectsLive) published" + (projectsDraft > 0 ? " · \(projectsDraft) draft" : "") }
    var postsText: String { "\(postsLive) published" + (postsDraft > 0 ? " · \(postsDraft) draft" : "") }
    var experienceText: String { "\(workLive) role\(workLive == 1 ? "" : "s")" }
    var volunteerText: String { "\(volunteerLive) role\(volunteerLive == 1 ? "" : "s")" }
}
