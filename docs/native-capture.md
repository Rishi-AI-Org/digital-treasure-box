# Native Capture Status

## Current State

- Web paste capture is implemented through `/api/captures`.
- Chrome capture has a Manifest V3 scaffold and posts to the same capture API.
- Android app config declares `SEND text/plain` intent filters, but must be verified on a real device after Expo prebuild.
- iOS share-extension Swift and plist files exist and are staged into the iOS project by `apps/mobile/plugins/with-share-extension-assets.js` during `npx expo prebuild`.

## iOS Completion Steps

After dependencies install:

```bash
cd apps/mobile
npx expo prebuild --platform ios
```

Then open the generated iOS project in Xcode and create a Share Extension target:

- Target name: `DTB21ShareExtension`
- Bundle identifier: `app.digitaltreasurebox.mobile.share`
- Source files: `ios/DTB21ShareExtension/ShareViewController.swift`
- Info plist: `ios/DTB21ShareExtension/Info.plist`

This is necessary because iOS share extensions are separate app-extension targets, not only runtime JavaScript behavior.

## Android Completion Steps

After dependencies install:

```bash
cd apps/mobile
npx expo prebuild --platform android
```

Verify on a real device that sharing text/URLs from YouTube, Chrome, X, Kindle, and Amazon opens DTB21. If Expo does not pass `ACTION_SEND` extras into the JS entrypoint reliably, add a native share-intent module before app-store release.

