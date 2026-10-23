"""EcoScan viewport regression audit in a Chromium mobile emulator.

Live Gemini, Google Maps, real devices and a production backend are NOT exercised.
"""
import base64
import datetime
import http.server
import json
import os
import pathlib
import shutil
import threading
import time
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
WWW = ROOT / "www"
OUT = ROOT / "mobile-audit"
OUT.mkdir(exist_ok=True)
PORT = 4173
BASE = "http://127.0.0.1:" + str(PORT)
SIZES = [(320, 640), (375, 812), (390, 844), (430, 932)]
USER = {
    "id": 42, "nombre": "Luciano", "apellido": "Prueba",
    "email": "prueba@ecoscan.local", "ciudad": "Cipolletti",
    "createdAt": "2026-08-01T12:00:00Z",
}
def item(i, category, object_name, material, status, confidence):
    return {
        "id": i, "categoria": category, "objeto": object_name, "material": material,
        "estado": status, "reciclable": status == "apto", "confianza": confidence,
        "preparacion": ["Enjuagar si corresponde"] if status == "apto" else [],
        "observacion": "Resultado de prueba visual, no generado por Gemini.",
        "imagenUrl": None, "createdAt": "2026-10-%02dT13:30:00Z" % (20-i),
    }
DATA = [
    item(1, "plastico", "Botella PET de bebida", "Plástico compatible con PET", "apto", 94),
    item(2, "lata", "Lata de aluminio", "Aluminio", "apto", 91),
    item(3, "carton", "Caja de cartón manchada", "Cartón", "no_apto", 88),
    item(4, "vidrio", "Frasco de vidrio", "Vidrio", "apto", 96),
    item(5, "papel", "Hojas de papel", "Papel", "apto", 98),
    item(6, "desconocido", "Objeto no identificado", "Desconocido", "desconocido", 40),
]
ROUTES = [
    ("home", "/#/app/home", ".home-container"),
    ("historial", "/#/app/historial", ".history-container"),
    ("puntos-verdes", "/#/app/puntos-verdes", ".points-container"),
    ("perfil", "/#/app/perfil", ".profile-container"),
]
problems = []
diagnostics = []
javascript_errors = []

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WWW), **kwargs)
    def log_message(self, *args):
        pass

def mock_backend(route):
    pathname = urlparse(route.request.url).path
    if pathname == "/historial":
        response = DATA
    elif pathname.startswith("/users/"):
        response = USER
    elif pathname.startswith("/auth/"):
        response = {"accessToken": "preview.token.preview", "user": USER}
    else:
        response = []
    route.fulfill(status=200, content_type="application/json", body=json.dumps(response))

INSPECTION = """
() => {
  const width = window.innerWidth;
  const rootWidth = document.documentElement.scrollWidth;
  const names = ['.login-page','.register-container','.home-container',
    '.history-container','.points-container','.profile-container',
    '.layout-footer','.bottom-navigation'];
  const outside = [];
  for (const selector of names) {
    for (const el of document.querySelectorAll(selector)) {
      const b = el.getBoundingClientRect();
      if (b.width > 1 && (b.left < -3 || b.right > width + 3)) {
        outside.push({selector, left: Math.round(b.left), right: Math.round(b.right)});
      }
    }
  }
  const content = [];
  for (const el of document.querySelectorAll('ion-content')) {
    const scroll = el.shadowRoot?.querySelector('[part="scroll"]') ||
      el.shadowRoot?.querySelector('.inner-scroll');
    if (scroll && el.getBoundingClientRect().width > 0) {
      content.push({width: scroll.clientWidth, scrollWidth: scroll.scrollWidth});
    }
  }
  const nav = document.querySelector('.bottom-navigation');
  const navItems = nav ? Array.from(nav.querySelectorAll('a,button')).map(el => {
    const b = el.getBoundingClientRect();
    return {left: Math.round(b.left), right: Math.round(b.right),
      width: Math.round(b.width), height: Math.round(b.height)};
  }) : [];
  return {width, rootWidth, outside, content, navItems};
}
"""

def audit(page, name):
    data = page.evaluate(INSPECTION)
    diagnostics.append({"screen": name, **data})
    issues = []
    if data["rootWidth"] > data["width"] + 3 or data["outside"]:
        issues.append("Page/container overflows viewport horizontally")
    if any(x["width"] > 0 and x["scrollWidth"] > x["width"] + 3 for x in data["content"]):
        issues.append("Ionic content overflows horizontally")
    if data["navItems"]:
        if len(data["navItems"]) != 5:
            issues.append("Bottom navigation has unexpected control count")
        if any(x["left"] < -3 or x["right"] > data["width"]+3 or x["width"] < 32 or x["height"] < 32 for x in data["navItems"]):
            issues.append("Bottom navigation item clipped or smaller than 32 px")
    for issue in issues:
        problems.append({"screen":name, "issue":issue,"diagnostics":data})
    print("MOBILE_SCREEN " + json.dumps({"screen":name,"pageWidth":data["rootWidth"],
        "viewport":data["width"],"overflow":len(issues),"navigation":len(data["navItems"])}),flush=True)

def shot(page,name, preview=False):
    filename = OUT / (name + ".jpg")
    page.screenshot(path=str(filename),type="jpeg",quality=75,animations="disabled",timeout=15000)
    if preview:
        image=page.screenshot(type="jpeg",quality=32,animations="disabled",timeout=15000)
        print("VISUAL_PREVIEW:"+name+":"+base64.b64encode(image).decode("ascii"),flush=True)

def visit(page,name,url,selector,preview=False):
    page.goto(BASE+url,wait_until="domcontentloaded",timeout=20000)
    page.locator(selector).first.wait_for(state="visible",timeout=16000)
    page.wait_for_timeout(500)
    audit(page,name)
    shot(page,name,preview)

def visual_test(browser,width,height):
    screen = str(width)+"x"+str(height)
    context = browser.new_context(viewport={"width":width,"height":height},is_mobile=True,
        has_touch=True,device_scale_factor=1,locale="es-AR",timezone_id="America/Argentina/Buenos_Aires")
    context.route("http://localhost:3000/**",mock_backend)
    context.route("https://maps.googleapis.com/**",lambda route:route.abort())
    page = context.new_page()
    errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    try:
        visit(page,screen+"-login","/#/login",".login-card",preview=width==390)
        visit(page,screen+"-registro","/#/registro",".register-card")
        expires=int(time.time())+3600
        payload=base64.urlsafe_b64encode(json.dumps({"exp":expires,"sub":USER["id"]}).encode()).decode().rstrip("=")
        token="test."+payload+".test"
        page.evaluate("""([token, user]) => {
            localStorage.setItem('ecoScan-token',token);
            localStorage.setItem('ecoScan-user',JSON.stringify(user));
        }""",[token,USER])
        for name,url,selector in ROUTES:
            full=screen+"-"+name
            try:
                visit(page,full,url,selector,preview=width==390 and name=="home")
                if width in (320,390):
                    el=page.locator("ion-content.layout-content")
                    if el.count():
                        el.evaluate("(el) => el.scrollToBottom(0)")
                        page.wait_for_timeout(300)
                        shot(page,full+"-bottom")
                if name=="home" and width==390:
                    button=page.locator("button.scan-navigation")
                    button.click(timeout=6000)
                    page.locator(".scan-options-content").wait_for(state="visible",timeout=8000)
                    shot(page,full+"-scan-options")
                    cancel=page.locator(".cancel-scan-options")
                    if cancel.count(): cancel.click()
                if name=="historial" and width==390:
                    card=page.locator(".history-card")
                    if card.count():
                        card.first.click()
                        page.wait_for_timeout(450)
                        shot(page,full+"-detail")
                if name=="perfil" and width==390:
                    edit=page.locator(".edit-profile-button")
                    if edit.count():
                        edit.click()
                        page.wait_for_timeout(300)
                        shot(page,full+"-edit")
            except Exception as exc:
                problems.append({"screen":full,"issue":"UI navigation or interaction","error":str(exc)[:600]})
                print("MOBILE_FAIL "+full+" "+str(exc)[:300],flush=True)
    except Exception as exc:
        problems.append({"screen":screen,"issue":"Login or registration failure","error":str(exc)[:600]})
        print("MOBILE_FAIL "+screen+" "+str(exc)[:300],flush=True)
    finally:
        if errors:
            javascript_errors.append({"device":screen,"errors":errors[:15]})
        context.close()

if __name__=="__main__":
    if not (WWW/"index.html").exists():
        raise SystemExit("First run npm run build")
    server=http.server.ThreadingHTTPServer(("127.0.0.1",PORT),QuietHandler)
    thread=threading.Thread(target=server.serve_forever,daemon=True)
    thread.start()
    browser_binary=shutil.which("google-chrome") or shutil.which("google-chrome-stable") or shutil.which("chromium")
    try:
        with sync_playwright() as p:
            kwargs={"headless":True,"args":["--no-sandbox","--disable-dev-shm-usage"]}
            if browser_binary:kwargs["executable_path"]=browser_binary
            browser=p.chromium.launch(**kwargs)
            print("MOBILE_BROWSER "+str(browser_binary or "bundled Chromium"),flush=True)
            for width,height in SIZES:
                visual_test(browser,width,height)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    count=len(list(OUT.glob("*.jpg")))
    report={"date":datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "screenshots":count,"pagesChecked":len(diagnostics),"problems":problems,
        "javascriptErrors":javascript_errors,"diagnostics":diagnostics,
        "limitations":"Chromium mobile viewport emulator and mocked backend. Physical phones, camera, real Google Maps, native keyboard and Gemini live accuracy not tested."}
    (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print("MOBILE_AUDIT_SUMMARY "+json.dumps({"screenshots":count,"pages":len(diagnostics),
        "problems":len(problems),"devicesWithErrors":len(javascript_errors)}),flush=True)
    if problems: raise SystemExit(1)
