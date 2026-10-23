import { environment } from '../../environments/environment';

// El backend local sigue siendo el valor predeterminado para ionic serve y adb reverse.
// En Android físico se puede indicar una URL de red desde la pantalla de login.
const STORAGE_KEY = 'ecoScan-api-base-url';

export function getApiBaseUrl(): string {
  const savedUrl = localStorage.getItem(STORAGE_KEY);
  return (savedUrl || environment.apiBaseUrl).replace(/\/+$/, '');
}

export function setApiBaseUrl(value: string): void {
  const input = value.trim();
  let parsed: URL;

  try {
    parsed = new URL(input);
  } catch {
    throw new Error('Ingresá una URL válida, por ejemplo http://192.168.1.100:3000');
  }

  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname !== '/' && parsed.pathname !== '')
  ) {
    throw new Error('Usá solamente la dirección base http:// o https:// del servidor.');
  }

  // Fuera de una red local se exige HTTPS para proteger el inicio de sesión.
  const hostname = parsed.hostname.toLowerCase();
  const parts = hostname.split('.').map(Number);
  const privateIpv4 = parts.length === 4 &&
    parts.every(part => Number.isInteger(part) && part >= 0 && part <= 255) &&
    (parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 127);

  const isLocal = hostname === 'localhost' || hostname === '[::1]' || privateIpv4;

  if (parsed.protocol === 'http:' && !isLocal) {
    throw new Error('Para un servidor público usá HTTPS. HTTP solo se permite en redes locales.');
  }

  const normalized = parsed.origin;

  if (normalized === environment.apiBaseUrl) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, normalized);
  }
}

export function apiUrl(path: string): string {
  return `${getApiBaseUrl()}/${path.replace(/^\/+/, '')}`;
}

export function isBackendRequest(url: string): boolean {
  const base = getApiBaseUrl();
  return url === base || url.startsWith(`${base}/`);
}

export function scanImageUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return apiUrl(path);
}
