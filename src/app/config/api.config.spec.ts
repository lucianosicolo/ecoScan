import {
  apiUrl,
  getApiBaseUrl,
  isBackendRequest,
  scanImageUrl,
  setApiBaseUrl,
} from './api.config';

describe('EcoScan configurable backend API', () => {
  beforeEach(() => {
    localStorage.removeItem('ecoScan-api-base-url');
  });

  afterEach(() => {
    localStorage.removeItem('ecoScan-api-base-url');
  });

  it('uses the configured development URL by default', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:3000');
    expect(apiUrl('scan')).toBe('http://localhost:3000/scan');
  });

  it('can select a private-network backend without changing the source code', () => {
    setApiBaseUrl('http://192.168.1.30:3000/');

    expect(getApiBaseUrl()).toBe('http://192.168.1.30:3000');
    expect(apiUrl('/auth/login')).toBe('http://192.168.1.30:3000/auth/login');
    expect(scanImageUrl('/uploads/scans/example.jpg'))
      .toBe('http://192.168.1.30:3000/uploads/scans/example.jpg');
  });

  it('does not send authentication headers to other servers', () => {
    setApiBaseUrl('https://api.example.org');

    expect(isBackendRequest('https://api.example.org/historial')).toBe(true);
    expect(isBackendRequest('https://api.example.org.evil.test/historial')).toBe(false);
    expect(isBackendRequest('https://unrelated.example.com/historial')).toBe(false);
  });

  it('rejects unencrypted requests to a public Internet server', () => {
    expect(() => setApiBaseUrl('http://api.example.org:3000')).toThrowError();
  });

  it('keeps an absolute scan image URL unchanged', () => {
    expect(scanImageUrl('https://cdn.example.org/residue.jpg'))
      .toBe('https://cdn.example.org/residue.jpg');
  });
});
