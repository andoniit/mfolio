import PhotosUI
import SwiftUI

/// Add or edit one role — work or voluntary — natively.
///
/// A role is structured fields rather than prose, so this is a plain form (no
/// rich-text engine). It sends exactly what `ExperienceForm.tsx` sends, and
/// checks the same rules the API does before saving, so problems show up here
/// rather than as a failed request.
struct ExperienceEditorView: View {
    /// nil for a new role.
    let item: ExperienceItem?
    let category: String
    var onChange: () -> Void = {}

    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    @State private var fields: ExperienceFields
    @State private var saved: ExperienceFields
    @State private var currentID: String?

    @State private var saving = false
    @State private var error: String?
    @State private var confirmLeave = false
    @State private var confirmTrash = false
    @State private var trashing = false

    @State private var logoItem: PhotosPickerItem?
    @State private var uploadingLogo = false

    init(item: ExperienceItem?, category: String, onChange: @escaping () -> Void = {}) {
        self.item = item
        self.category = category
        self.onChange = onChange
        let start = item.map(ExperienceFields.init) ?? ExperienceFields(category: category)
        _fields = State(initialValue: start)
        _saved = State(initialValue: start)
        _currentID = State(initialValue: item?.id)
    }

    private var isNew: Bool { currentID == nil }
    private var hasChanges: Bool { fields != saved }
    private var noun: String { fields.isVolunteer ? "Voluntary Role" : "Experience" }

    var body: some View {
        Form {
            if let error {
                Section { ErrorCard(message: error) }
            }
            roleSection
            datesSection
            aboutSection
            EditableListSection(
                title: "Highlights", items: $fields.highlights,
                placeholder: "Something you did or achieved", empty: "No highlights yet.",
                footer: "Shown as bullet points, in this order.", multiline: true
            )
            EditableListSection(
                title: "Skills", items: $fields.skills,
                placeholder: "Add a skill", empty: "No skills listed."
            )
            companySection
            publishingSection
            if !isNew { trashSection }
        }
        .navigationTitle(isNew ? "New \(noun)" : "Edit \(noun)")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(hasChanges)
        .toolbar { toolbar }
        .onChange(of: logoItem) { _, item in
            guard let item else { return }
            Task { await uploadLogo(item) }
        }
        .confirmationDialog("Discard unsaved changes?", isPresented: $confirmLeave, titleVisibility: .visible) {
            Button("Discard changes", role: .destructive) { dismiss() }
            Button("Keep editing", role: .cancel) {}
        }
        .confirmationDialog("Move this role to the trash?", isPresented: $confirmTrash, titleVisibility: .visible) {
            Button("Move to Trash", role: .destructive) { Task { await trash() } }
        } message: {
            Text("It comes off the site straight away. You can restore it from Trash in the list.")
        }
    }

    // MARK: - Sections

    private var roleSection: some View {
        Section("Role") {
            TextField(fields.isVolunteer ? "Role" : "Job title", text: $fields.title)
                .font(.headline)
            TextField(fields.isVolunteer ? "Organisation" : "Company", text: $fields.company)
            TextField("Location", text: $fields.location)
            if !fields.isVolunteer {
                Picker("Job type", selection: $fields.employmentType) {
                    Text("Not set").tag(String?.none)
                    ForEach(ExperienceFields.employmentTypes, id: \.self) { Text($0).tag(Optional($0)) }
                }
            }
        }
    }

    private var datesSection: some View {
        Section {
            Toggle(fields.isVolunteer ? "I'm still doing this" : "I currently work here", isOn: $fields.isCurrent)

            // Work needs a start date; a voluntary role can go without one.
            if fields.isVolunteer {
                Toggle("Has a start date", isOn: $fields.hasStart)
            }
            if fields.hasStart {
                DatePicker("Started", selection: day($fields.startDay), displayedComponents: .date)
            }
            if !fields.isCurrent {
                Toggle("Has an end date", isOn: $fields.hasEnd)
                if fields.hasEnd {
                    DatePicker("Ended", selection: day($fields.endDay),
                               in: (fields.hasStart ? date(fields.startDay) : .distantPast)...,
                               displayedComponents: .date)
                }
            }
        } header: {
            Text("Dates")
        } footer: {
            Text("The site shows the month and year.")
        }
    }

    private var aboutSection: some View {
        Section("Description") {
            TextField("What the role was about", text: $fields.description, axis: .vertical)
                .lineLimit(3...10)
        }
    }

    private var companySection: some View {
        Section {
            TextField("Company website", text: $fields.companyURL)
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()

            HStack(spacing: 12) {
                logoPreview
                TextField("Logo URL or /logo/name.png", text: $fields.logoURL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .font(.subheadline)
            }
            PhotosPicker(selection: $logoItem, matching: .images) {
                HStack {
                    Label(fields.logoURL.isEmpty ? "Upload a logo" : "Replace logo", systemImage: "photo")
                    Spacer()
                    if uploadingLogo { ProgressView() }
                }
            }
            .disabled(uploadingLogo)
        } header: {
            Text(fields.isVolunteer ? "Organisation" : "Company")
        } footer: {
            if WebLink.isInvalid(fields.companyURL) {
                Text(verbatim: "The website must be a web address, like https://example.com.").foregroundStyle(.red)
            } else if fields.logoProblem {
                Text(verbatim: "The logo must be a web address or a site path starting with /.").foregroundStyle(.red)
            } else {
                Text("Logos can be uploaded here, or point at one already on the site.")
            }
        }
    }

    /// Site paths ("/logo/acme.png") are relative to the site, so they're
    /// previewed from there.
    private var logoPreview: some View {
        let raw = fields.logoURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let url = raw.hasPrefix("/") ? URL(string: AppConfig.siteURL + raw) : URL(string: raw)
        return AsyncImage(url: raw.isEmpty ? nil : url) { phase in
            switch phase {
            case .success(let image): image.resizable().aspectRatio(contentMode: .fit)
            default: Image(systemName: "building.2").foregroundStyle(.secondary)
            }
        }
        .frame(width: 36, height: 36)
        .background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }

    private var publishingSection: some View {
        Section {
            Toggle("Published", isOn: $fields.published)
            Stepper("Position: \(fields.sortOrder)", value: $fields.sortOrder, in: 0...99)
        } header: {
            Text("On the site")
        } footer: {
            Text("Lower positions show first. You can also drag roles into order from the list.")
        }
    }

    private var trashSection: some View {
        Section {
            Button(role: .destructive) { confirmTrash = true } label: {
                HStack {
                    Label("Move to Trash", systemImage: "trash")
                    Spacer()
                    if trashing { ProgressView() }
                }
            }
            .disabled(trashing)
        }
    }

    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        if hasChanges {
            ToolbarItem(placement: .topBarLeading) {
                Button("Cancel") { confirmLeave = true }
            }
        }
        ToolbarItem(placement: .topBarTrailing) {
            if saving {
                ProgressView()
            } else {
                Button(isNew ? "Add" : "Save") { Task { await save() } }
                    .fontWeight(.semibold)
                    .disabled((!hasChanges && !isNew) || uploadingLogo)
            }
        }
        ToolbarItem(placement: .keyboard) {
            HStack {
                Spacer()
                Button("Done") {
                    UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
                }
            }
        }
    }

    // MARK: - Dates

    private static let dayFormat = PostMeta.dayFormatter(utc: false)

    private func date(_ day: String) -> Date { Self.dayFormat.date(from: day) ?? .now }

    private func day(_ binding: Binding<String>) -> Binding<Date> {
        Binding(get: { date(binding.wrappedValue) }, set: { binding.wrappedValue = Self.dayFormat.string(from: $0) })
    }

    // MARK: - Actions

    private func save() async {
        if let problem = fields.problem() {
            error = problem
            return
        }
        saving = true
        defer { saving = false }
        do {
            let payload = try fields.payload()
            let client = APIClient(auth: auth)
            if let currentID {
                try await client.put("/api/experiences/\(currentID)", body: payload)
            } else {
                let created = try await client.post("/api/experiences", body: payload, as: CreatedPost.self)
                currentID = created.id
            }
            saved = fields
            error = nil
            onChange()
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func uploadLogo(_ item: PhotosPickerItem) async {
        uploadingLogo = true
        defer {
            uploadingLogo = false
            logoItem = nil
        }
        do {
            guard let raw = try await item.loadTransferable(type: Data.self),
                  // Logos render small; 600px keeps them crisp at 3x without
                  // shipping a full-size photo.
                  let optimized = ImageOptimizer.optimize(raw, maxPixel: 600, budget: 250_000)
            else {
                error = "That image couldn't be read."
                return
            }
            let uploaded = try await ImageUploader.upload(optimized, folder: "experience-logos", auth: auth)
            fields.logoURL = uploaded.publicURL
            error = nil
        } catch {
            self.error = "Logo upload failed: \(error.localizedDescription)"
        }
    }

    private func trash() async {
        guard let currentID else { return }
        trashing = true
        defer { trashing = false }
        do {
            try await APIClient(auth: auth).delete("/api/experiences/\(currentID)")
            onChange()
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
