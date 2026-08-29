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
| Blog | Publish, unpublish, trash and restore posts |
| Projects | Publish, unpublish, trash and restore |
| Experience / Voluntary Roles | Publish, unpublish, trash and restore |
| Categories / Tags | Add and delete |
| Newsletter | Read the subscriber list |
| Resume | See what's live, preview it, remove it |
| SEO Tools / Web dashboard | Opened on the web, already signed in |

Writing long posts and filling in detailed forms stays in the web editor —
rebuilding TipTap natively isn't worth it — but the app seeds your session into
the web view, so those screens open signed in rather than at a login page.

## App icon

`MfolioAdmin/AppIcon.icon` is an Icon Composer bundle (the `anikap · andon ·
tech` mark on an automatic mint gradient). Xcode 26 compiles it directly and
also emits flattened PNGs, which is what iOS versions before 26 display — the
deployment target here is iOS 17, so those fallbacks matter.

In `project.yml` the bundle is added as a single `type: file` entry and excluded
from the recursive source glob. Left to recurse, XcodeGen would add `icon.json`
and the SVG as separate files and the icon would never build.

To change it, edit the `.icon` in Icon Composer and rebuild — no other step.

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

## Build and install on your iPhone

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
```
