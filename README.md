# Imposter V4 — Android source project

Offline-first pass-the-phone party game. App name: **Imposter**. Android application ID: `com.arshwadhwa.imposter.v3`.

## Implemented in this source
- 28 categories and 1,500 default word entries.
- Emoji category and Random Chaos removed.
- Bollywood and Hollywood packs contain 75 entries each.
- Celebrities & Influencers contains 25 female Bollywood stars, 25 female Hollywood stars, and 20 male celebrities.
- Tricky Similar Words contains 30 entries. Five adult packs contain 60 entries each; adult-film performer names appear only in Porn & Dirty Stuff.
- Category selection is limited to 10 per game session.
- Adult categories are optional and not selected by default.
- Role reveal is hold-to-show/release-to-hide; category labels are not shown on the reveal card. Imposter hints are generic and do not show the category or secret word.
- Word packs and settings are stored locally; custom word packs are available under Settings.

## Build web assets
Install Node.js LTS, then run from this folder in PowerShell:
```powershell
npm install
npm run build
```

## Add Android project
Install Android Studio and Android SDK, then run:
```powershell
npx cap add android
npx cap sync android
npx cap open android
```
If an `android` folder already exists, skip `npx cap add android`. Build the debug APK from Android Studio.

This ZIP contains source files; it is not a prebuilt APK. Your V2 project is separate and remains untouched.


## V4 database update
- Display name: Imposter
- 27 categories, 830 entries total
- Removed Dirty Confessions
- Social Media & Memes is disabled with zero entries
- Adult categories include blowjob terminology and BDSM/kink vocabulary
- Cream and rich-purple theme
- App ID: com.arshwadhwa.imposter.v4

This is a separate V4 source folder. It does not modify V2 or V3.


## Important: install the custom Android launcher icon

The custom purple-and-cream detective icon is included at `www/icon-512.png`.
After creating the Android folder, run this from the project root in PowerShell:

```powershell
npx cap add android
.\APPLY_V5_ANDROID_ICON.ps1
npx cap sync android
```

Then build the APK from the `android` folder:

```powershell
$env:JAVA_HOME = "C:\Users\garvi\.jdks\jbr-21.0.11"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\gradlew.bat assembleDebug
```

The included script explicitly writes the custom icon into Android's native `mipmap-*` launcher resources. This is required because Capacitor sync alone does not replace Android launcher icons. If Android already exists, skip `npx cap add android` and run the script directly.
