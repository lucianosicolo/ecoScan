#!/usr/bin/env bash
# Native flow checks with a local fake backend. No Google Gemini request is made.
set -euo pipefail
OUT="android-feature-audit"
mkdir -p "$OUT"
adb wait-for-device
adb reverse tcp:3000 tcp:3000
python3 scripts/android-feature-backend.py >"$OUT/backend-stdout.txt" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
for n in $(seq 1 24); do
  if curl -fsS http://127.0.0.1:3000/health >/dev/null; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:3000/health > "$OUT/backend-health.json"
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell logcat -c || true
adb shell am start -W -n com.ecoscan.app/.MainActivity > "$OUT/launch.txt"
sleep 10

snapshot(){
  local title="$1"
  adb exec-out screencap -p > "$OUT/$title.png"
  adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 || true
  adb exec-out cat /sdcard/window.xml > "$OUT/$title.xml" || true
  echo "NATIVE_SCREENSHOT $title"
}

# Native UI action selector based on accessible text and bounds.
ui(){
  local mode="$1"
  local term="$2"
  local file="$3"
  python3 - "$mode" "$term" "$file" <<'PY'
import xml.etree.ElementTree as ET,subprocess,re,sys
mode,term,p=sys.argv[1:]
try:
    root=ET.parse(p).getroot()
except Exception as e:
    print("UI_PARSE_FAIL",str(e))
    sys.exit(2)
nodes=list(root.iter("node"))
matched=[]
if mode=="edit":
    matched=[n for n in nodes if n.attrib.get("class","").endswith(".EditText")]
    index=int(term)
    if len(matched)<=index:
        print("UI_EDIT_NOT_FOUND",index,len(matched))
        sys.exit(4)
    matched=matched[index:index+1]
elif mode=="text":
    term=term.strip().lower()
    available=[n for n in nodes if n.attrib.get("bounds") not in ("[0,0][0,0]",None)]
    def fields(node):
        return (node.attrib.get("text","").strip().lower(),node.attrib.get("content-desc","").strip().lower())
    exact=[n for n in available if term in fields(n)]
    partial=[n for n in available if term in (" ".join(fields(n))).lower()]
    matched=exact if exact else partial
    matched.sort(key=lambda n: n.attrib.get("clickable")!="true")
else:sys.exit(2)
for node in matched:
    match=re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]",node.attrib.get("bounds",""))
    if not match:continue
    x1,y1,x2,y2=map(int,match.groups())
    x,y=(x1+x2)//2,(y1+y2)//2
    print("UI_TAP",mode,term,x,y,flush=True)
    subprocess.run(["adb","shell","input","tap",str(x),str(y)],check=True)
    sys.exit(0)
print("UI_NOT_FOUND",mode,term,flush=True)
sys.exit(3)
PY
}
record(){
  echo "$1" | tee -a "$OUT/observations.txt"
}
native_alive(){
  if ! adb shell pidof com.ecoscan.app >/dev/null 2>&1; then
    record "NATIVE_FATAL_APP_PROCESS_MISSING"
    return 1
  fi
}

snapshot 00-login
# Android 15 Google APIs emulator may cold-start with a Pixel Launcher ANR.
# Dismiss the system overlay and verify login after the OS becomes responsive.
for attempt in 1 2 3 4; do
  if grep -Eqi "isn.t responding|not responding" "$OUT/00-login.xml"; then
    record "NATIVE_OS_ANR_OVERLAY_DISMISSED attempt=$attempt"
    ui text "Close app" "$OUT/00-login.xml" || adb shell input keyevent 4 || true
    sleep 6
    snapshot 00-login
    continue
  fi
  if grep -q "Iniciar sesión" "$OUT/00-login.xml"; then
    break
  fi
  record "NATIVE_LOGIN_WAITING attempt=$attempt"
  sleep 5
  snapshot 00-login
done
if ! grep -q "Iniciar sesión" "$OUT/00-login.xml"; then
  record "NATIVE_FAIL_LOGIN_NOT_RENDERED"
  exit 1
fi
record "NATIVE_LOGIN_RENDERED"

if ! ui edit 0 "$OUT/00-login.xml"; then
  record "NATIVE_FAIL_EMAIL_FIELD_NOT_FOUND"; exit 1
fi
adb shell input text 'test@ecoscan.local'
adb shell input keyevent 4
sleep 1
snapshot 01-email
if ! ui edit 1 "$OUT/01-email.xml"; then
  record "NATIVE_FAIL_PASSWORD_FIELD_NOT_FOUND"; exit 1
fi
adb shell input text 'Prueba123!'
adb shell input keyevent 4
sleep 1
snapshot 02-filled-login
if ! ui text "Ingresar" "$OUT/02-filled-login.xml"; then
  record "NATIVE_FAIL_LOGIN_BUTTON_NOT_FOUND"; exit 1
fi
sleep 5
snapshot 03-after-login
if ! grep -Eqi "Hola|Identificá tus residuos|Tu espacio ecológico" "$OUT/03-after-login.xml";then
  record "NATIVE_FAIL_LOGIN_NO_HOME_SCREEN"
  exit 1
fi
record "NATIVE_AUTH_MOCK_LOGIN_SUCCESS"
native_alive

# Load Google Maps with the app's existing script and document native result.
if ui text "Puntos" "$OUT/03-after-login.xml";then
  sleep 13
  snapshot 04-map
  if grep -q "Puntos verdes" "$OUT/04-map.xml"; then
    record "NATIVE_MAP_NAVIGATION_CONFIRMED"
  else
    record "NATIVE_FAIL_MAP_PAGE_NOT_OPEN"
    exit 1
  fi
  if grep -q "No pudimos cargar el mapa" "$OUT/04-map.xml"; then
    record "NATIVE_MAP_API_ERROR_FALLBACK_VISIBLE"
  elif grep -q "Cargando mapa" "$OUT/04-map.xml"; then
    record "NATIVE_MAP_STILL_LOADING"
  else
    record "NATIVE_MAP_UI_VISIBLE_MAP_NOT_VERIFIED"
  fi
  if grep -q "Punto Limpio" "$OUT/04-map.xml"; then
    record "NATIVE_MAP_LIST_VISIBLE"
  fi
else
  record "NATIVE_MAP_NAVIGATION_NOT_ACCESSIBLE"
fi

snapshot 05-before-scan
if ui text "Escanear" "$OUT/05-before-scan.xml"; then
  sleep 2
  snapshot 06-scan-options
  if grep -q "Tomar una foto" "$OUT/06-scan-options.xml"; then
    record "NATIVE_SCAN_CAMERA_OPTION_VISIBLE"
  else
    record "NATIVE_SCAN_CAMERA_OPTION_NOT_VISIBLE"
  fi
  if grep -q "Elegir imagen" "$OUT/06-scan-options.xml"; then
    record "NATIVE_SCAN_GALLERY_OPTION_VISIBLE"
  else
    record "NATIVE_SCAN_GALLERY_OPTION_NOT_VISIBLE"
  fi

  # Gallery: inject a small fixture into Android's media library.
  python3 - "$OUT/test-residue.png" <<'PY'
import sys,struct,zlib
p=sys.argv[1]
w=h=224
data=bytearray()
for y in range(h):
    data.append(0)
    for x in range(w):
        data.extend((30,150,70) if 64<x<160 and 28<y<198 else (245,248,244))
def chunk(t,data):return struct.pack(">I",len(data))+t+data+struct.pack(">I",zlib.crc32(t+data)&0xffffffff)
open(p,"wb").write(b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",struct.pack(">IIBBBBB",w,h,8,2,0,0,0))+chunk(b"IDAT",zlib.compress(bytes(data)))+chunk(b"IEND",b""))
PY
  adb push "$OUT/test-residue.png" /sdcard/Pictures/ecoscan-fixture.png >/dev/null
  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Pictures/ecoscan-fixture.png >/dev/null || true

  if ui text "Elegir imagen" "$OUT/06-scan-options.xml";then
    sleep 4
    snapshot 07-native-photo-picker
    record "NATIVE_GALLERY_PICKER_LAUNCHED"
    # Prefer a picker tile with an accessible image label, do not choose an arbitrary private photo.
    if ui text "Photo taken on" "$OUT/07-native-photo-picker.xml"; then
      sleep 3
      snapshot 08-after-gallery-selection
      if ui text "Add" "$OUT/08-after-gallery-selection.xml"; then
        sleep 2
        record "NATIVE_PHOTO_PICKER_CONFIRMED"
      fi
      sleep 7
      snapshot 08b-after-scan
      if grep -q '"path": "/scan"' "$OUT/requests.jsonl"; then
        record "NATIVE_GALLERY_IMAGE_UPLOAD_CONFIRMED"
      else
        record "NATIVE_GALLERY_IMAGE_UPLOAD_NOT_OBSERVED"
      fi
      if grep -q "Finalizar" "$OUT/08b-after-scan.xml"; then
        ui text "Finalizar" "$OUT/08b-after-scan.xml" || true
      fi
    else
      record "NATIVE_GALLERY_FIXTURE_NOT_SELECTABLE_AUTOMATICALLY"
    fi
    adb shell input keyevent 4 || true
    sleep 1
  else
    record "NATIVE_GALLERY_ACTION_NOT_ACCESSIBLE"
  fi

  snapshot 09-after-gallery
  if ui text "Escanear" "$OUT/09-after-gallery.xml";then
    sleep 1
    snapshot 10-options-camera
    if ui text "Tomar una foto" "$OUT/10-options-camera.xml";then
      sleep 5
      snapshot 11-camera-intent
      record "NATIVE_CAMERA_ACTION_INVOKED"
      if ui text "Shutter" "$OUT/11-camera-intent.xml"; then
        sleep 3
        snapshot 11b-after-shutter
        record "NATIVE_CAMERA_SHUTTER_TAPPED"
        if ui text "Done" "$OUT/11b-after-shutter.xml"; then
          sleep 3
        elif ui text "Use photo" "$OUT/11b-after-shutter.xml"; then
          sleep 3
        fi
        snapshot 11c-after-camera
        if grep -q '"path": "/scan"' "$OUT/requests.jsonl"; then
          record "NATIVE_CAMERA_OR_GALLERY_UPLOAD_OBSERVED"
        fi
      else
        record "NATIVE_CAMERA_SHUTTER_NOT_ACCESSIBLE"
      fi
      adb shell input keyevent 4 || true
    else
      record "NATIVE_CAMERA_ACTION_NOT_ACCESSIBLE"
    fi
  fi
else
  record "NATIVE_SCAN_BUTTON_NOT_ACCESSIBLE"
fi
sleep 2
snapshot 12-end
native_alive
adb logcat -d -v brief -s AndroidRuntime:E Capacitor/Console:E chromium:E > "$OUT/webview-errors.txt" || true
if grep -q "FATAL EXCEPTION" "$OUT/webview-errors.txt";then
  record "NATIVE_CRASH_DETECTED"
  exit 1
fi
COUNT="$(find "$OUT" -maxdepth 1 -name '*.png' | wc -l)"
record "NATIVE_FEATURE_SUMMARY appAlive=true fatalCrashes=0 images=$COUNT"
