import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthStore

    var body: some View {
        Group {
            if auth.isRestoring {
                ProgressView().controlSize(.large)
            } else if auth.isSignedIn {
                DashboardView()
            } else {
                SignInView()
            }
        }
        .animation(.easeInOut(duration: 0.2), value: auth.isSignedIn)
        .task { await auth.restore() }
    }
}
