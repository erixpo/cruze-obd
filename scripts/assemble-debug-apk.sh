#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"

if [[ -z "$SDK" || ! -d "$SDK" ]]; then
  echo "Set ANDROID_HOME (or ANDROID_SDK_ROOT) to an SDK with platforms;android-36 and build-tools;35.0.0" >&2
  exit 1
fi

if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -x /usr/lib/jvm/java-21-openjdk-amd64/bin/java ]]; then
    export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
  fi
fi

printf 'sdk.dir=%s\n' "$SDK" > "$ROOT/android/local.properties"

(
  cd "$ROOT/android"
  ./gradlew assembleDebug --no-daemon
)

SRC="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
DEST_DIR="${ARTIFACTS_DIR:-/opt/cursor/artifacts}"
mkdir -p "$DEST_DIR"
cp -f "$SRC" "$DEST_DIR/cruze-obd-debug.apk"
cp -f "$SRC" "$ROOT/android/app/build/outputs/apk/debug/cruze-obd-debug.apk"

echo "APK: $DEST_DIR/cruze-obd-debug.apk"
echo "applicationId: sk.erik.cruzeobd"
