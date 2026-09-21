# Mfolio Admin (iOS)

A native dashboard for the portfolio, so you can update it from your phone.
It talks to the site's `/api` with your Supabase login — the same account and
the same endpoints the web dashboard uses.

## What's in the app

| Screen | What you can do |
|---|---|
| Dashboard | Live counts for every section, pending-review badges |
| Outside of Work | Add / edit / delete photos, food spots and games; publish or hide; upload from your camera roll (shrunk on-device before sending) |
| Photo Wall | Approve, reject, unpublish or delete visitor Polaroids |
| Recommendations | Same, for visitor sticky notes |
| Blog | Write, edit and publish posts natively — rich text, images, links, cover, category, tags, publish date — plus unpublish, trash and restore |
| Projects | Publish, unpublish, trash and restore |
| Experience / Voluntary Roles | Publish, unpublish, trash and restore |
| Categories / Tags | Add and delete |
| Analytics | Google Analytics for the site: views per day, visitors, countries / regions / cities, top pages, referrers, devices, and who's on the site right now |
| Newsletter | Read the subscriber list |
| Resume | See what's live, preview it, remove it |
| SEO Tools / Web dashboard | Opened on the web, already signed in |

The screens still on the web (SEO tools, the rest of the dashboard) open
signed in: the app seeds your session into the web view rather than landing
you on a login page. Long-pressing a post also offers the web editor, as a
fallback.

## Writing posts

New Post and tapping any post open a native editor: title and body on the
main screen, and everything else — URL, excerpt, cover image, category, tags,
publish toggle and date, trash — under **Details** (the sliders button).

**The body is the web's own TipTap engine, bundled into the app.** Posts are
stored as TipTap documents (`content_json`) plus the HTML the site renders
(`content_html`), and the web dashboard edits the same posts. A native text
view would mean converting every save through a lossy translator; running the
same engine with the same extensions means the app writes exactly what the web
does. Checked against the live posts: loading and re-saving each one gives
byte-identical HTML and structurally identical JSON.

Everything around the text is native — the format bar, menus, photo picking
and upload, link entry, metadata. The engine lives in `MfolioAdmin/Editor/` as
a page and one script, loaded from the app bundle. It never touches the
network: its CSP forbids it, navigation away is refused, and images are
uploaded natively and handed in as finished URLs. It works offline; only Save
needs a connection.

**Crash insurance.** A couple of seconds after each change the editor writes
the post to `Application Support/PostDrafts/`, and clears it on a successful
save. If the app is killed mid-post, reopening it offers the draft back. Backing
out with unsaved changes asks first.

Saves go to the same `/api/posts` endpoints with the same payload as
`BlogForm.tsx`. The one server addition is `GET /api/posts/:id` (owner-only),
which returns the full post with its `tag_ids` — the web edit page reads the
database directly, so nothing exposed that before.

### Changing the editor

The source is `ios/editor/editor.js`. After editing it:

```bash
npm run build:ios-editor
```

That bundles it into `MfolioAdmin/Editor/editor.bundle.js`, which is committed,
so building the app never needs Node — only changing the editor does. Its
extension list must stay in step with
`src/components/tiptap/templates/simple/simple-editor.tsx`; a node the web
knows and the app doesn't would be dropped when a post is opened here.

## App icon

`MfolioAdmin/AppIcon.icon` is an Icon Composer bundle (the `anikap · andon ·
tech` mark on an automatic mint gradient). Xcode 26 compiles it directly and
also emits flattened PNGs, which is what iOS versions before 26 display — the
deployment target here is iOS 17, so those fallbacks matter.

In `project.yml` the bundle is added as a single `type: file` entry and excluded
from the recursive source glob. Left to recurse, XcodeGen would add `icon.json`
and the SVG as separate files and the icon would never build.

To change it, edit the `.icon` in Icon Composer and rebuild — no other step.

## Analytics

The Analytics screen reads the site's GA4 property through
`/api/admin/analytics`. Everything the screen shows arrives in one request —
which is three calls to Google behind it (two report batches plus realtime),
because GA4 caps a batch at five reports.

**No Google credential ever reaches the phone.** `src/lib/ga4.ts` signs a
service-account assertion server-side, swaps it for a one-hour access token
(cached in module memory) and returns plain numbers. The route is behind the
same `verifyAdmin` check as the rest of `/api`.

What it shows, for the last 7 / 28 / 90 / 365 days:

- Views, visitors, new visitors and sessions, each against the previous window
  of the same length, plus engagement rate and average visit length
- Views (or visitors, or sessions) per day, as a chart you can scrub
- Countries, regions and cities — regions and cities are qualified by their
  country, since "Maharashtra" or "Springfield" alone is ambiguous
- Top pages, acquisition channels, referrers, devices and browsers
- A live count of who is on the site right now

### Connecting it

Until the server has credentials the screen shows these steps rather than an
error — the route answers `{ configured: false, reason }` with a 200.

1. **Google Cloud console** → pick (or make) a project → **APIs & Services →
   Enable APIs** → enable **Google Analytics Data API**.
2. **IAM & Admin → Service Accounts → Create**. No project roles are needed —
   the access it uses is granted inside Analytics, in step 4.
3. On that account: **Keys → Add key → Create new key → JSON**. Download it.
4. **Google Analytics → Admin → Property access management → +** and add the
   service account's email with the **Viewer** role.
5. Set these on the server (`.env.local`, and the production env):

   ```
   GA4_PROPERTY_ID=123456789
   GOOGLE_SERVICE_ACCOUNT_EMAIL=...@....iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

   `GA4_PROPERTY_ID` is the **numeric** id under Admin → Property details, not
   the `G-XXXXXXXXXX` measurement id the site's tag uses. On Vercel, where
   multi-line values get mangled, paste the whole downloaded JSON into
   `GOOGLE_SERVICE_ACCOUNT_JSON` instead of the last two lines — raw or base64,
   both are accepted.

6. Redeploy, and pull to refresh in the app.

If Google answers 403, step 4 is the one that was missed; the app says so with
the service account's email in the message.

GA4 finalises the current day over the following hours, so today's bar keeps
moving. The realtime count is its own thing — active users in the last 30
minutes — and if that call fails the rest of the screen still renders.

## Photo handling

Pictures are optimised on the phone before upload, in `Core/ImageOptimizer.swift`:

- Downsampled at decode time with ImageIO, capped at 1600px on the long edge —
  nothing on the site renders larger. The full-resolution bitmap is never
  decoded, so a 48MP photo doesn't spike memory.
- JPEG quality steps down until the file is under ~900KB, and never comes out
  larger than the original.
- Camera metadata is dropped, GPS included — these go to a public bucket.
- Images with transparency stay PNG rather than being flattened onto black.

## Prerequisites

The server must have `ADMIN_EMAILS` set (see `.env.example`). Without it every
write is refused, by design — Supabase signups are open, so a valid token alone
doesn't prove it's you.

## Install it on your phone, privately

TestFlight internal testing is the way to run this as a real app on your own
device without publishing anything. Internal testers skip Beta App Review, so a
build is installable minutes after it finishes processing. Up to 100 internal
testers; each build stays valid for 90 days, after which you upload a new one.

1. **App Store Connect → Apps → +** and create the app against the bundle id
   `com.anirudha.mfolioadmin`. Nothing here is published or searchable.
2. In Xcode: select the **MfolioAdmin** target → **Signing & Capabilities** →
   tick *Automatically manage signing* and choose your team.
3. **Product → Destination → Any iOS Device**, then **Product → Archive**.
4. In the Organizer: **Distribute App → TestFlight (Internal Testing Only)**.
5. Once processing finishes, **TestFlight → Internal Testing**, add yourself as
   a tester, and install from the TestFlight app on your phone.

Each upload needs a higher `CURRENT_PROJECT_VERSION` than the last — bump it in
`project.yml` and re-run `xcodegen generate`.

`ITSAppUsesNonExemptEncryption` is already declared `false` in `Info.plist`
(the app uses only HTTPS and the system Keychain), so uploads skip the export
compliance question. `PrivacyInfo.xcprivacy` declares the `UserDefaults`
required-reason API and the sign-in email, so uploads come back clean.

## Build and run from Xcode directly

```bash
brew install xcodegen          # once
cd ios && xcodegen generate    # regenerate after adding files
open MfolioAdmin.xcodeproj
```

In Xcode: select the **MfolioAdmin** target → **Signing & Capabilities** → tick
*Automatically manage signing* and pick your team. Change the bundle identifier
if `com.anirudha.mfolioadmin` is taken. Then plug in your iPhone, pick it as the
run destination, and press ▶.

With a paid Apple Developer account the build stays valid for a year. For
over-the-air installs and automatic updates, archive it and push to **TestFlight
internal testing** — internal testers skip App Review.

## First launch

There is nothing to configure — the server details are baked into
`Core/AppConfig.swift`. Sign in with your normal admin email and password;
tokens are kept in the Keychain and refreshed automatically.

If you ever move the site to a new domain, change `siteURL` in that one file
and rebuild. None of the baked-in values are secrets: the publishable key is the
same one your website already ships to every browser, and the service-role key
never touches the phone.

## Layout

```
ios/
  project.yml              XcodeGen spec — the .xcodeproj is generated, not committed
  MfolioAdmin/
    App/                   Entry point
    Core/                  Config, Keychain, auth, API client, image upload
    Models/                Codable mirrors of the API shapes
    Views/                 One file per screen
    Editor/                The bundled post-body editor (built from ../editor)
  editor/                  Source for Editor/ — `npm run build:ios-editor`
```

On the server side the analytics screen is `src/lib/ga4.ts` (the GA4 Data API
client) and `src/app/api/admin/analytics/route.ts` (the one endpoint it calls).

```
```
