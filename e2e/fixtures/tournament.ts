import { APIRequestContext } from '@playwright/test';
import { API_BASE } from './data';

export interface TournamentData {
  name?: string;
  location?: string;
  category?: string;
  gender?: string;
  league?: string;
  start_date?: string;
}

async function getFirstEnum(request: APIRequestContext, token: string, endpoint: string): Promise<string> {
  const res = await request.get(`${API_BASE}/tournaments/enums/${endpoint}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  // API returns [{value, label}, ...] or [value, ...]
  const first = Array.isArray(data) ? data[0] : Object.values(data)[0];
  return typeof first === 'object' ? (first as { value: string }).value : String(first);
}

export async function createTournamentViaApi(
  request: APIRequestContext,
  token: string,
  data: TournamentData = {},
): Promise<number> {
  const category = data.category ?? await getFirstEnum(request, token, 'categories');
  const gender = data.gender ?? await getFirstEnum(request, token, 'genders');
  const league = data.league ?? await getFirstEnum(request, token, 'leagues');

  const res = await request.post(`${API_BASE}/tournaments/`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: data.name ?? 'Tournoi Test E2E',
      location: data.location ?? 'Club E2E',
      category,
      gender,
      league,
      start_date: data.start_date ?? '2027-06-01',
    },
  });
  if (!res.ok()) throw new Error(`createTournament failed: ${res.status()} ${await res.text()}`);
  const body = await res.json();
  return body.id as number;
}

export async function addRankedPairsViaApi(
  request: APIRequestContext,
  token: string,
  tournamentId: number,
  count: number,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    const ranking = 500 - i * 50;
    const res = await request.post(`${API_BASE}/tournaments/${tournamentId}/pairs/`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        player1: {
          last_name: `Joueur${i * 2 + 1}`,
          first_name: `Prenom${i * 2 + 1}`,
          license_number: `${1000000 + i * 2}a`,
          ranking,
        },
        player2: {
          last_name: `Joueur${i * 2 + 2}`,
          first_name: `Prenom${i * 2 + 2}`,
          license_number: `${1000000 + i * 2 + 1}b`,
          ranking: ranking - 10,
        },
      },
    });
    if (!res.ok()) throw new Error(`addPair ${i} failed: ${res.status()} ${await res.text()}`);
  }
}

export async function setGameFormatViaApi(
  request: APIRequestContext,
  token: string,
  tournamentId: number,
): Promise<void> {
  // Get first available game format
  const formatsRes = await request.get(`${API_BASE}/tournaments/enums/game-formats/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const formats = await formatsRes.json();
  const firstFormat = Array.isArray(formats) ? formats[0] : Object.values(formats)[0];
  const formatValue = typeof firstFormat === 'object' ? (firstFormat as { value: string }).value : String(firstFormat);

  // Get first configuration
  const configRes = await request.get(`${API_BASE}/tournaments/enums/configurations/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const configs = await configRes.json();
  const firstConfig = Array.isArray(configs) ? configs[0] : Object.values(configs)[0];
  const configValue = typeof firstConfig === 'object' ? (firstConfig as { value: string }).value : String(firstConfig);

  const res = await request.patch(`${API_BASE}/tournaments/${tournamentId}/`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      game_format: formatValue,
      configuration: configValue,
      estimated_match_duration: 60,
    },
  });
  if (!res.ok()) throw new Error(`setGameFormat failed: ${res.status()} ${await res.text()}`);
}

export async function generateBracketViaApi(
  request: APIRequestContext,
  token: string,
  tournamentId: number,
  dimension: number = 8,
  pairsCount: number = dimension,
): Promise<number> {
  // All pairs enter at the highest available round for the given dimension
  const res = await request.post(`${API_BASE}/tournaments/${tournamentId}/bracket/`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      dimension,
      nb_pair_round_64: 0,
      nb_pair_round_32: 0,
      nb_pair_round_16: 0,
      nb_pair_round_8: dimension === 8 ? pairsCount : 0,
      nb_pair_round_4: dimension === 4 ? pairsCount : 0,
    },
  });
  if (!res.ok()) throw new Error(`generateBracket failed: ${res.status()} ${await res.text()}`);
  const body = await res.json();
  return body.id as number;
}

export async function drawBracketViaApi(
  request: APIRequestContext,
  token: string,
  tournamentId: number,
): Promise<void> {
  const res = await request.post(`${API_BASE}/tournaments/${tournamentId}/bracket/draw/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) throw new Error(`drawBracket failed: ${res.status()} ${await res.text()}`);
}

export async function getMatchesViaApi(
  request: APIRequestContext,
  token: string,
  tournamentId: number,
  status?: string,
): Promise<{ id: number; status: string; pair1: number | null; pair2: number | null }[]> {
  const params = status ? `?status=${status}` : '';
  const res = await request.get(`${API_BASE}/tournaments/${tournamentId}/matches/${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) throw new Error(`getMatches failed: ${res.status()} ${await res.text()}`);
  const body = await res.json();
  return Array.isArray(body) ? body : body.results ?? [];
}

export async function startMatchViaApi(
  request: APIRequestContext,
  token: string,
  tournamentId: number,
  matchId: number,
): Promise<void> {
  const res = await request.post(
    `${API_BASE}/tournaments/${tournamentId}/matches/${matchId}/start/`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok()) throw new Error(`startMatch failed: ${res.status()} ${await res.text()}`);
}

export async function scoreMatchViaApi(
  request: APIRequestContext,
  token: string,
  tournamentId: number,
  matchId: number,
  winnerId: number,
  score: string = '6/3 6/2',
): Promise<void> {
  const res = await request.patch(
    `${API_BASE}/tournaments/${tournamentId}/matches/${matchId}/score/`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: { winner_id: winnerId, score },
    },
  );
  if (!res.ok()) throw new Error(`scoreMatch failed: ${res.status()} ${await res.text()}`);
}

export async function getTournamentBracketViaApi(
  request: APIRequestContext,
  token: string,
  tournamentId: number,
): Promise<Record<string, unknown>> {
  const res = await request.get(`${API_BASE}/tournaments/${tournamentId}/bracket/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) throw new Error(`getTournamentBracket failed: ${res.status()}`);
  return res.json();
}

export async function getTournamentViaApi(
  request: APIRequestContext,
  token: string,
  tournamentId: number,
): Promise<Record<string, unknown>> {
  const res = await request.get(`${API_BASE}/tournaments/${tournamentId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) throw new Error(`getTournament failed: ${res.status()}`);
  return res.json();
}

/**
 * Full setup: create tournament + 8 ranked pairs + game format + bracket + draw.
 * Returns { tournamentId, token } ready for bracket/match tests.
 */
export async function setupFullTournamentWithBracket(
  request: APIRequestContext,
  token: string,
): Promise<number> {
  const tournamentId = await createTournamentViaApi(request, token);
  await addRankedPairsViaApi(request, token, tournamentId, 8);
  await setGameFormatViaApi(request, token, tournamentId);
  await generateBracketViaApi(request, token, tournamentId, 8);
  await drawBracketViaApi(request, token, tournamentId);
  return tournamentId;
}
