#!/usr/bin/env bash
set -euo pipefail
OUT="android-native-audit"
mkdir -p "$OUT"
echo "DEVICE_SMOKE Android emulator, no real login or cloud API calls"
adb wait-for-device
adb shell getprop ro.build.version.release | tr -d '\r' > "$OUT/android-version.txt"
adb shell wm size | tr -d '\r' > "$OUT/display-size.txt"
echo "Compiling native debug APK..."
(cd android && bash gradlew assembleDebug --no-daemon)
APK="android/app/build/outputs/apk/debug/app-debug.apk"
test -s "$APK"
adb install -r "$APK"
adb shell pm path com.ecoscan.app | tr -d '\r' > "$OUT/installed-package.txt"
grep -q com.ecoscan.app "$OUT/installed-package.txt"
adb shell logcat -c || true
adb shell am force-stop com.ecoscan.app || true
adb shell am start -W -n com.ecoscan.app/.MainActivity | tee "$OUT/launch.txt"
echo "Waiting for Ionic WebView..."
sleep 12
PID="$(adb shell pidof com.ecoscan.app | tr -d '\r')"
if [[ -z "$PID" ]]; then
  echo "NATIVE_FAIL App process missing after launch"
  exit 1
fi
echo "NATIVE_APP_PID $PID"

snapshot() {
  local name="$1"
  adb exec-out screencap -p > "$OUT/$name.png"
  if ! adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1; then
    echo "UI_XML_WARN Can't dump hierarchy ($name)"
  else
    adb exec-out cat /sdcard/window.xml > "$OUT/$name.xml" || true
  fi
}
tap_text() {
  local name="$1"
  local file="$2"
  python3 - "$file" "$name" <<'PY'
import sys,xml.etree.ElementTree as ET,re,subprocess
p,needle=sys.argv[1:]
try:
  root=ET.parse(p).getroot()
except Exception as e:
  print("NATIVE_UI_DUMP_ERROR",str(e))
  sys.exit(2)
found=False
for node in root.iter("node"):
  attrs=node.attrib
  visible=(attrs.get("text","")+" "+attrs.get("content-desc",""))
  if needle.lower() not in visible.lower():
    continue
  box=re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]",attrs.get("bounds",""))
  if not box: continue
  x1,y1,x2,y2=map(int,box.groups())
  x,y=(x1+x2)//2,(y1+y2)//2
  print("NATIVE_UI_TAP",needle,x,y,flush=True)
  subprocess.run(["adb","shell","input","tap",str(x),str(y)],check=True)
  found=True
  break
if not found:
  print("NATIVE_UI_ELEMENT_NOT_ACCESSIBLE",needle)
  sys.exit(3)
PY
}
echo "Taking login screenshots and accessibility tree..."
snapshot "01-login"
sleep 4
snapshot "02-login-settled"
if tap_text "Configurar servidor" "$OUT/02-login-settled.xml"; then
  sleep 2
  snapshot "03-server-dialog"
  adb shell input keyevent 4
  sleep 1
  snapshot "04-login-after-close"
else
  echo "NATIVE_UI_NOTE Server settings not accessible to automation" | tee -a "$OUT/observations.txt"
fi
if [[ -f "$OUT/04-login-after-close.xml" ]] && tap_text "Crear cuenta" "$OUT/04-login-after-close.xml"; then
  sleep 3
  snapshot "05-registration"
  adb shell input keyevent 4
  sleep 2
  snapshot "06-back-login"
elif tap_text "Crear cuenta" "$OUT/02-login-settled.xml"; then
  sleep 3
  snapshot "05-registration"
  adb shell input keyevent 4
  sleep 2
  snapshot "06-back-login"
else
  echo "NATIVE_UI_NOTE Register link not accessible to automation" | tee -a "$OUT/observations.txt"
fi
adb shell settings put system font_scale 1.3
sleep 2
snapshot "07-font-scale-130"
adb shell settings put system font_scale 1.0
adb shell dumpsys activity activities > "$OUT/activity.txt"
adb logcat -d -v brief -s AndroidRuntime:E Capacitor/Console:E chromium:E > "$OUT/webview-errors.txt" || true
if grep -q "FATAL EXCEPTION" "$OUT/webview-errors.txt"; then
  echo "NATIVE_FAIL Crash found in AndroidRuntime"
  grep -A 15 "FATAL EXCEPTION" "$OUT/webview-errors.txt" | head -50
  exit 1
fi
PID="$(adb shell pidof com.ecoscan.app | tr -d '\r')"
if [[ -z "$PID" ]]; then
  echo "NATIVE_FAIL App process missing after navigation"
  exit 1
fi
COUNT="$(find "$OUT" -maxdepth 1 -name '*.png' | wc -l)"
echo "NATIVE_SUMMARY appInstalled=true appAlive=true fatalCrashes=0 screenshots=$COUNT"
