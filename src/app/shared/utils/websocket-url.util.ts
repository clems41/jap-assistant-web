/**
 * Construit l'URL du WebSocket public d'un tournoi à partir de la base URL de l'API REST
 * (absolue en local/dev, relative en prod) et de l'origin du navigateur (utilisé seulement
 * quand `apiBaseUrl` est relative). Fonction pure, sans accès à `window` ni à Angular, pour
 * rester trivialement testable avec de simples chaînes en fixture.
 */
function mapHttpProtocolToWs(protocol: string): string {
  return protocol === 'https:' ? 'wss:' : 'ws:';
}

function resolveWsSchemeAndHost(apiBaseUrl: string, origin: string): string {
  const isAbsolute = /^https?:\/\//i.test(apiBaseUrl);
  const url = new URL(isAbsolute ? apiBaseUrl : origin);
  // 0.0.0.0 is a valid server bind address but browsers refuse outgoing connections to it.
  const host = url.hostname === '0.0.0.0' ? url.host.replace('0.0.0.0', 'localhost') : url.host;
  return `${mapHttpProtocolToWs(url.protocol)}//${host}`;
}

export function buildPublicTournamentWebSocketUrl(
  apiBaseUrl: string,
  origin: string,
  code: string,
): string {
  const schemeAndHost = resolveWsSchemeAndHost(apiBaseUrl, origin);
  return `${schemeAndHost}/ws/public/tournaments/${encodeURIComponent(code)}/`;
}
