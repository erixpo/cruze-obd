# Cruze OBD

Capacitor **Android-first** OBD-II app for a **2012 Chevrolet Cruze 1.8 104 kW (2H0 / A18XER) LPG**. Talks to a cheap **ELM327 Mini** over **Bluetooth Classic (SPP / RFCOMM)** — not BLE. UI is casual Slovak; code is English.

Phone target: Samsung Galaxy S23 Ultra.

**applicationId:** `sk.erik.cruzeobd`

## Debug APK (sideload, no Play Store)

A signed-for-debug APK is built with `./gradlew assembleDebug`.

**Download / artifact path (this cloud run):**

- `/opt/cursor/artifacts/cruze-obd-debug.apk`
- same file via `/cursor/stores/self/artifacts/cruze-obd-debug.apk`
- Gradle output: `android/app/build/outputs/apk/debug/app-debug.apk`

Size is ~5 MB. Package label: **Cruze OBD**. minSdk 24, targetSdk 36.

### Install on S23 Ultra

**Option A — file on the phone**

1. Copy `cruze-obd-debug.apk` to the phone (Drive, cable, Nearby Share).
2. Open it in **My Files**.
3. If Android blocks it: Settings → Security and privacy → **Install unknown apps** → allow the Files / Chrome / Drive app that opened the APK.
4. Install. First launch: allow **Nearby devices** (Bluetooth) and **Location**.

**Option B — adb**

```bash
adb install -r cruze-obd-debug.apk
```

USB debugging must be on. `-r` replaces an older build with the same `sk.erik.cruzeobd` id.

This is a **debug** build (Android debug keystore), not a Play-signed release. Fine for Erik’s phone.

On first open, tap **Spustiť demo budíky** to confirm the UI. For a real ELM327 Mini: pair in system Bluetooth first, turn demo off, then **Načítať spárované**.

### Rebuild the APK

Needs JDK 21 + Android SDK (platform 36, build-tools 35). Then:

```bash
export ANDROID_HOME=/path/to/Android/Sdk   # or ANDROID_SDK_ROOT
npm install
npm run apk:debug
```

That runs `npm run build`, `npx cap sync android`, and `./gradlew assembleDebug`.

## Bluetooth plugin choice

We use **`@ascentio-it/capacitor-bluetooth-serial` v8** with **Capacitor 8**.

Why this one:

- Maintained fork of `@e-is/capacitor-bluetooth-serial` (itself a fork of the archived agro1desenvolvimento plugin).
- Android RFCOMM / SPP, including `connectInsecure` — cheap ELM327 Mini clones almost never do secure pairing well.
- **`getPairedDevices()`** so the Connect screen can list bonded dongles (discoverable scan is unreliable after pairing).
- Capacitor 8 peer, last published August 2026.

Not used: `@capacitor-community/bluetooth-le` — that is BLE only. An ELM327 Mini Classic will not show up there.

iOS is out of scope (Classic SPP is painful). The web build is for **demo mode** only.

## Demo (no car)

```bash
npm install
npm run dev
```

Open http://127.0.0.1:43187 → **Spustiť demo budíky**. Gauges animate. Fuel toggle, DTCs, trips, jerk simulation, car profile and after-drive score all work on fake data.

```bash
npm run build
npm test
```

## Run on the S23 Ultra

1. Pair the ELM327 in **Android Settings → Bluetooth** first. PIN is often `1234` or `0000`. Name is usually `ELM327`, `OBDII`, or `V-LINK`.
2. Plug the Mini into the OBD port (under the dash, driver side). Ignition **ON** (not just ACC) so the ECU is awake.
3. Build and sync:

```bash
npm install
npm run build
npx cap sync android
npx cap open android
```

4. In Android Studio, run on the phone (USB debugging).
5. On first launch grant **Nearby devices / Bluetooth** (Android 12+) and **Location** (needed for Classic scan on some versions, and optional GPS on jerk events).
6. In the app: turn **demo off**, tap **Načítať spárované**, pick the Mini, wait for AT init + capability scan.

Reconnect: clones drop mid-poll. The client disconnects, `connectInsecure` again, re-runs AT init, then retries the PID. Slovak errors if it still dies.

### Android 12+ permissions

The plugin already declares:

- `BLUETOOTH` / `BLUETOOTH_ADMIN` (max SDK 30)
- `BLUETOOTH_SCAN` + `BLUETOOTH_CONNECT` (API 31+)
- `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`

The app also uses `@capacitor/geolocation` for optional coordinates on a jerk event.

## Module split

```
src/bt/       Bluetooth Classic transport (native + mock)
src/obd/      ELM init, PID decode, capability, DTC, freeze frame
src/car/      cruze-profile.ts defaults (sviečky, STK, LPG notes)
src/store/    Capacitor Preferences JSON (trips, events, settings)
src/ui/       Slovak screens
src/session/  poll loop, jerk detect, trip math
```

Persistence is Preferences + JSON (trips/events). SQLite is not wired — not worth the native plugin for this volume.

## Known Mini-clone limits

- Drops after a few minutes; power from the OBD port is noisy.
- Echo / spaces / `SEARCHING...` even after `ATE0 ATS0`.
- Some ignore `ATSP0` and need ignition cycle.
- Voltage (PID 42), MAF, fuel rate are **only shown if capability scan says they exist**.
- This dongle does **not** talk to the LPG ECU (reducer pressure, LPG injectors). Fuel mode is a **manual tag**.

## Next (stubbed, not invented)

See `src/obd/todos.ts`:

- GM Mode 22 enhanced PIDs — capture on *this* Cruze first.
- Deep Mode 06 TID/CID maps.
- Full A/B trim maps (LPG vs benzín) once trip history exists.

## License

MIT
