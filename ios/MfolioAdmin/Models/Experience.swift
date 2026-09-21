import Foundation

/// A role being edited — the web form's fields, as plain values so `==` means
/// "something changed" for the unsaved-changes guard.
///
/// Work history and voluntary roles are the same table split by `category`,
/// with two differences the form respects: a voluntary role may have no start
/// date, and has no job type.
struct ExperienceFields: Hashable {
    let category: String
    var title = ""
    var company = ""
    var location = ""
    var employmentType: String?
    var companyURL = ""
    /// A full URL or a site path like `/logo/acme.jpeg`, as the web accepts.
    var logoURL = ""

    var hasStart = true
    var startDay = PostMeta.today
    var isCurrent = false
    var hasEnd = false
    var endDay = PostMeta.today

    var description = ""
    var highlights: [String] = []
    var skills: [String] = []
    /// Lower comes first on the site.
    var sortOrder = 0
    var published = false

    /// The job types the API accepts — `EMPLOYMENT_TYPES` in experience-payload.ts.
    static let employmentTypes = ["Full-time", "Part-time", "Contract", "Freelance", "Internship", "Self-employed"]

    var isVolunteer: Bool { category == "volunteer" }

    init(category: String) {
        self.category = category
        // A new role starts as current, since that's the usual reason to add one.
        isCurrent = true
        hasStart = category != "volunteer"
    }

    init(_ item: ExperienceItem) {
        category = item.category ?? "work"
        title = item.title
        company = item.company
        location = item.location ?? ""
        employmentType = item.employment_type.flatMap { $0.isEmpty ? nil : $0 }
        companyURL = item.company_url ?? ""
        logoURL = item.logo_url ?? ""
        if let start = PostMeta.day(fromISO: item.start_date) {
            startDay = start
            hasStart = true
        } else {
            hasStart = false
        }
        isCurrent = item.is_current ?? false
        if let end = PostMeta.day(fromISO: item.end_date) {
            endDay = end
            hasEnd = true
        }
        description = item.description ?? ""
        highlights = item.highlights ?? []
        skills = item.skills ?? []
        sortOrder = item.sort_order ?? 0
        published = item.published ?? false
    }

    /// The first thing wrong with the form, in the API's own words — checked
    /// before saving so the answer comes without a round trip.
    func problem() -> String? {
        if title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return "Add a role or job title." }
        if company.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return isVolunteer ? "Add the organisation." : "Add the company."
        }
        if !isVolunteer && !hasStart { return "Add a start date." }
        if hasStart && !isCurrent && hasEnd && endDay < startDay { return "The end date is before the start date." }
        if WebLink.isInvalid(companyURL) { return "The company link must be a web address (https://…)." }
        if logoProblem { return "The logo must be a web address or a site path starting with /." }
        return nil
    }

    /// Logos may be a site path ("/logo/acme.jpeg") as well as a URL.
    var logoProblem: Bool {
        let trimmed = logoURL.trimmingCharacters(in: .whitespacesAndNewlines)
        return !trimmed.isEmpty && !trimmed.hasPrefix("/") && WebLink.isInvalid(trimmed)
    }

    /// Field for field what ExperienceForm.tsx sends.
    func payload() throws -> [String: Any?] {
        func trimmedOrNil(_ s: String) -> String? {
            let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
            return t.isEmpty ? nil : t
        }
        // A site path goes as-is; anything else must be a web address.
        var logo = trimmedOrNil(logoURL)
        if let value = logo, !value.hasPrefix("/") {
            logo = try WebLink.normalize(value, field: "The logo")
        }
        return [
            "title": trimmedOrNil(title),
            "company": trimmedOrNil(company),
            "company_url": try WebLink.normalize(companyURL, field: "The company link"),
            "logo_url": logo,
            "sort_order": sortOrder,
            "location": trimmedOrNil(location),
            "employment_type": isVolunteer ? nil : employmentType,
            "start_date": hasStart ? startDay : nil,
            "end_date": (isCurrent || !hasEnd) ? nil : endDay,
            "is_current": isCurrent,
            "description": trimmedOrNil(description),
            "highlights": highlights,
            "skills": skills,
            "category": category,
            "published": published,
        ]
    }
}
