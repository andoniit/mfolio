import SwiftUI

/// Email and password, nothing else. The server details are baked into
/// `AppConfig`, so there is no configuration to get wrong on the phone.
struct SignInView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var email = UserDefaults.standard.string(forKey: "auth.email") ?? ""
    @State private var password = ""
    @State private var busy = false
    @State private var error: String?

    private var canSubmit: Bool { !busy && !email.isEmpty && !password.isEmpty }

    var body: some View {
        NavigationStack {
            Form {
                // No Section(_:content:footer:) overload exists — the title has
                // to come from an explicit header when a footer is present.
                Section {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .onSubmit { if canSubmit { submit() } }
                } header: {
                    Text("Sign in")
                } footer: {
                    Text("Uses the same account as the web dashboard.")
                }

                if let error {
                    Section {
                        Text(error).foregroundStyle(.red).font(.callout)
                    }
                }

                Section {
                    Button {
                        submit()
                    } label: {
                        HStack {
                            Spacer()
                            if busy { ProgressView() } else { Text("Sign in").bold() }
                            Spacer()
                        }
                    }
                    .disabled(!canSubmit)
                }
            }
            .navigationTitle("Mfolio")
        }
    }

    private func submit() {
        busy = true
        error = nil
        Task {
            do {
                try await auth.signIn(email: email, password: password)
            } catch {
                self.error = error.localizedDescription
            }
            busy = false
        }
    }
}
