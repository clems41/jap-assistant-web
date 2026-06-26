import { buildPublicTournamentWebSocketUrl } from './websocket-url.util';

describe('buildPublicTournamentWebSocketUrl', () => {
  it('should derive ws:// from an absolute http:// apiBaseUrl with explicit host:port (local)', () => {
    const url = buildPublicTournamentWebSocketUrl(
      'http://0.0.0.0:8000/api/v1',
      'http://localhost:4200',
      'ABC123',
    );

    expect(url).toBe('ws://localhost:8000/ws/public/tournaments/ABC123/');
  });

  it('should normalize 0.0.0.0 to localhost so browsers can actually connect', () => {
    const url = buildPublicTournamentWebSocketUrl(
      'http://0.0.0.0:8000/api/v1',
      'http://localhost:4200',
      'NORM',
    );

    expect(url).toBe('ws://localhost:8000/ws/public/tournaments/NORM/');
  });

  it('should derive wss:// from an absolute https:// apiBaseUrl (dev)', () => {
    const url = buildPublicTournamentWebSocketUrl(
      'https://api.dev.jap-assistant.fr/api/v1',
      'https://app.dev.jap-assistant.fr',
      'XYZ789',
    );

    expect(url).toBe('wss://api.dev.jap-assistant.fr/ws/public/tournaments/XYZ789/');
  });

  it('should derive ws:// from a relative apiBaseUrl using an http:// origin (prod-shaped, http origin)', () => {
    const url = buildPublicTournamentWebSocketUrl(
      '/api',
      'http://jap-assistant.fr',
      'CODE1',
    );

    expect(url).toBe('ws://jap-assistant.fr/ws/public/tournaments/CODE1/');
  });

  it('should derive wss:// from a relative apiBaseUrl using an https:// origin (prod, https origin)', () => {
    const url = buildPublicTournamentWebSocketUrl(
      '/api',
      'https://jap-assistant.fr',
      'CODE2',
    );

    expect(url).toBe('wss://jap-assistant.fr/ws/public/tournaments/CODE2/');
  });

  it('should discard any path present in an absolute apiBaseUrl', () => {
    const url = buildPublicTournamentWebSocketUrl(
      'https://api.dev.jap-assistant.fr/api/v1/deep/nested/path',
      'https://app.dev.jap-assistant.fr',
      'CODE3',
    );

    expect(url).toBe('wss://api.dev.jap-assistant.fr/ws/public/tournaments/CODE3/');
  });

  it('should URL-encode a code value containing characters that need encoding', () => {
    const url = buildPublicTournamentWebSocketUrl(
      'http://0.0.0.0:8000/api/v1',
      'http://localhost:4200',
      'A B/C+D',
    );

    expect(url).toBe('ws://localhost:8000/ws/public/tournaments/A%20B%2FC%2BD/');
  });

  it('should always end with a trailing slash', () => {
    const url = buildPublicTournamentWebSocketUrl(
      '/api',
      'https://jap-assistant.fr',
      'TRAILING',
    );

    expect(url.endsWith('/')).toBeTrue();
  });
});
