import { MatchStatus } from '../models/tournament.models';
import { Pair } from '../models/pair.models';
import {
  PublicBracketMatch,
  PublicClassificationBracket,
  PublicMatch,
  PublicPair,
  PublicPlayer,
} from '../models/public-tournament.models';
import {
  mapPublicBracketMatch,
  mapPublicBracketResponse,
  mapPublicClassificationBracket,
  mapPublicMatch,
  mapPublicPair,
  mapPublicPlayer,
} from './public-tournament.utils';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const playerA: PublicPlayer = { first_name: 'Alice', last_name: 'Martin', ranking: 1200, club: 'Padel Club Lyon' };
const playerB: PublicPlayer = { first_name: 'Bob', last_name: 'Durand', ranking: 1100, club: 'Padel Club Lyon' };
const playerC: PublicPlayer = { first_name: 'Carla', last_name: 'Petit', ranking: 900, club: 'Padel Club Paris' };
const playerD: PublicPlayer = { first_name: 'David', last_name: 'Leroy', ranking: 950, club: 'Padel Club Paris' };

const pairAB: PublicPair = { player1: playerA, player2: playerB, weight: 1 };
const pairCD: PublicPair = { player1: playerC, player2: playerD, weight: 2 };

function makePublicMatch(overrides: Partial<PublicMatch> = {}): PublicMatch {
  return {
    round: 'FINALE',
    round_display: 'Finale',
    match_number: 1,
    order: 1,
    pair1: pairAB,
    pair2: pairCD,
    winner: null,
    game_format: 'C1',
    score: '',
    status: MatchStatus.UPCOMING,
    status_display: 'À venir',
    started_at: null,
    finished_at: null,
    estimated_start_at: null,
    ...overrides,
  };
}

function makePublicBracketMatch(overrides: Partial<PublicBracketMatch> = {}): PublicBracketMatch {
  return {
    round: 'FINALE',
    round_display: 'Finale',
    match_number: 1,
    pair1: pairAB,
    pair2: pairCD,
    winner: null,
    game_format: 'C1',
    score: '',
    status: MatchStatus.UPCOMING,
    status_display: 'À venir',
    started_at: null,
    finished_at: null,
    disabled: false,
    child1: null,
    child2: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// mapPublicPlayer / mapPublicPair
// ---------------------------------------------------------------------------

describe('mapPublicPlayer', () => {
  it('should map all fields and set license_number to an empty string', () => {
    const result = mapPublicPlayer(playerA);

    expect(result.first_name).toBe('Alice');
    expect(result.last_name).toBe('Martin');
    expect(result.ranking).toBe(1200);
    expect(result.license_number).toBe('');
  });

  it('should assign a negative synthetic id', () => {
    const result = mapPublicPlayer(playerA);
    expect(result.id).toBeLessThan(0);
  });

  it('should generate distinct ids across two calls', () => {
    const a = mapPublicPlayer(playerA);
    const b = mapPublicPlayer(playerB);
    expect(a.id).not.toBe(b.id);
  });

  it('should pass through a null ranking', () => {
    const result = mapPublicPlayer({ ...playerA, ranking: null });
    expect(result.ranking).toBeNull();
  });
});

describe('mapPublicPair', () => {
  it('should map player1, player2 and weight', () => {
    const result = mapPublicPair(pairAB);

    expect(result).toBeDefined();
    expect(result!.player1.first_name).toBe('Alice');
    expect(result!.player2.first_name).toBe('Bob');
    expect(result!.weight).toBe(1);
  });

  it('should assign a negative synthetic id', () => {
    const result = mapPublicPair(pairAB);
    expect(result!.id).toBeLessThan(0);
  });

  it('should return undefined when given null', () => {
    expect(mapPublicPair(null)).toBeUndefined();
  });

  it('should generate distinct ids across two calls', () => {
    const a = mapPublicPair(pairAB);
    const b = mapPublicPair(pairCD);
    expect(a!.id).not.toBe(b!.id);
  });

  it('should pass through a null weight', () => {
    const result = mapPublicPair({ ...pairAB, weight: null });
    expect(result!.weight).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mapPublicMatch — winner resolution
// ---------------------------------------------------------------------------

describe('mapPublicMatch', () => {
  it('should resolve winner_id to pair1 mapped id when winner equals pair1 by value', () => {
    const pm = makePublicMatch({ winner: pairAB, status: MatchStatus.FINISHED, finished_at: '2026-04-15T14:00:00Z' });

    const { match, pair1, pair2 } = mapPublicMatch(pm);

    expect(pair1).toBeDefined();
    expect(pair2).toBeDefined();
    expect(match.winner_id).toBe(pair1!.id);
    expect(match.pair1).toBe(pair1!.id);
    expect(match.pair2).toBe(pair2!.id);
  });

  it('should resolve winner_id to pair2 mapped id when winner equals pair2 by value', () => {
    const pm = makePublicMatch({ winner: pairCD, status: MatchStatus.FINISHED, finished_at: '2026-04-15T14:00:00Z' });

    const { match, pair2 } = mapPublicMatch(pm);

    expect(match.winner_id).toBe(pair2!.id);
  });

  it('should resolve winner_id to 0 when winner is null', () => {
    const pm = makePublicMatch({ winner: null });

    const { match } = mapPublicMatch(pm);

    expect(match.winner_id).toBe(0);
  });

  it('should resolve winner_id to 0 when winner cannot be matched to pair1 or pair2 by value', () => {
    const unrelatedWinner: PublicPair = { player1: playerA, player2: playerD, weight: null };
    const pm = makePublicMatch({ winner: unrelatedWinner });

    const { match } = mapPublicMatch(pm);

    expect(match.winner_id).toBe(0);
  });

  it('should map a complete finished match consistently', () => {
    const pm = makePublicMatch({
      status: MatchStatus.FINISHED,
      score: '6-3 6-4',
      winner: pairAB,
      finished_at: '2026-04-15T14:30:00Z',
      started_at: '2026-04-15T13:30:00Z',
    });

    const { match, pair1, pair2 } = mapPublicMatch(pm);

    expect(match.round).toBe('FINALE');
    expect(match.round_display).toBe('Finale');
    expect(match.match_number).toBe(1);
    expect(match.order).toBe(1);
    expect(match.game_format).toBe('C1');
    expect(match.score).toBe('6-3 6-4');
    expect(match.status).toBe(MatchStatus.FINISHED);
    expect(match.started_at).toBe('2026-04-15T13:30:00Z');
    expect(match.finished_at).toBe('2026-04-15T14:30:00Z');
    expect(match.pair1).toBe(pair1!.id);
    expect(match.pair2).toBe(pair2!.id);
    expect(match.winner_id).toBe(pair1!.id);
    expect(match.id).toBeLessThan(0);
  });

  it('should map null pair1/pair2 to null match.pair1/pair2', () => {
    const pm = makePublicMatch({ pair1: null, pair2: null, winner: null });

    const { match, pair1, pair2 } = mapPublicMatch(pm);

    expect(pair1).toBeUndefined();
    expect(pair2).toBeUndefined();
    expect(match.pair1).toBeNull();
    expect(match.pair2).toBeNull();
  });

  it('should default finished_at to an empty string when null', () => {
    const pm = makePublicMatch({ finished_at: null });

    const { match } = mapPublicMatch(pm);

    expect(match.finished_at).toBe('');
  });

  it('should pass through started_at and estimated_start_at as-is', () => {
    const pm = makePublicMatch({ started_at: '2026-04-15T13:00:00Z', estimated_start_at: '2026-04-15T12:00:00Z' });

    const { match } = mapPublicMatch(pm);

    expect(match.started_at).toBe('2026-04-15T13:00:00Z');
    expect(match.estimated_start_at).toBe('2026-04-15T12:00:00Z');
  });
});

// ---------------------------------------------------------------------------
// mapPublicBracketMatch
// ---------------------------------------------------------------------------

describe('mapPublicBracketMatch', () => {
  it('should map a leaf match (no children) with pair1/pair2 set to mapped ids', () => {
    const pbm = makePublicBracketMatch({ winner: pairAB, status: MatchStatus.FINISHED, finished_at: '2026-04-15T14:00:00Z' });

    const result = mapPublicBracketMatch(pbm);

    expect(result.child1).toBeNull();
    expect(result.child2).toBeNull();
    expect(result.pair1).toBeLessThan(0);
    expect(result.pair2).toBeLessThan(0);
    expect(result.winner_id).toBe(result.pair1);
  });

  it('should use 0 as the sentinel for missing pair1/pair2', () => {
    const pbm = makePublicBracketMatch({ pair1: null, pair2: null, winner: null });

    const result = mapPublicBracketMatch(pbm);

    expect(result.pair1).toBe(0);
    expect(result.pair2).toBe(0);
    expect(result.winner_id).toBe(0);
  });

  it('should resolve winner_id by value against pair1/pair2 and reuse the same synthetic id', () => {
    const pbm = makePublicBracketMatch({ winner: pairCD });

    const result = mapPublicBracketMatch(pbm);

    expect(result.winner_id).toBe(result.pair2);
    expect(result.winner_id).not.toBe(0);
  });

  it('should force pair1_can_be_placed and pair2_can_be_placed to false', () => {
    const pbm = makePublicBracketMatch();

    const result = mapPublicBracketMatch(pbm);

    expect(result.pair1_can_be_placed).toBe(false);
    expect(result.pair2_can_be_placed).toBe(false);
  });

  it('should pass through disabled as-is', () => {
    const enabled = mapPublicBracketMatch(makePublicBracketMatch({ disabled: false }));
    const disabled = mapPublicBracketMatch(makePublicBracketMatch({ disabled: true }));

    expect(enabled.disabled).toBe(false);
    expect(disabled.disabled).toBe(true);
  });

  it('should recurse into child1 and child2 over two levels', () => {
    const grandchild = makePublicBracketMatch({ round: 'R32', match_number: 10 });
    const child1 = makePublicBracketMatch({ round: 'R16', match_number: 5, child1: grandchild, child2: null });
    const root = makePublicBracketMatch({ round: 'FINALE', match_number: 1, child1, child2: null });

    const result = mapPublicBracketMatch(root);

    expect(result.child1).not.toBeNull();
    expect(result.child1!.round).toBe('R16');
    expect(result.child1!.child1).not.toBeNull();
    expect(result.child1!.child1!.round).toBe('R32');
    expect(result.child2).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mapPublicBracketMatch — pairsOut accumulation (must stay in sync with pair1/pair2/winner_id)
// ---------------------------------------------------------------------------

describe('mapPublicBracketMatch — pairsOut', () => {
  it('should push pair1 and pair2 into the shared pairsOut array with matching ids', () => {
    const pbm = makePublicBracketMatch();
    const pairsOut: Pair[] = [];

    const result = mapPublicBracketMatch(pbm, pairsOut);

    expect(pairsOut.length).toBe(2);
    expect(pairsOut.some(p => p.id === result.pair1)).toBe(true);
    expect(pairsOut.some(p => p.id === result.pair2)).toBe(true);
  });

  it('should accumulate pairs from all levels into the same array, all ids resolvable', () => {
    const grandchild = makePublicBracketMatch({ pair1: pairAB, pair2: pairCD });
    const child1 = makePublicBracketMatch({ pair1: pairAB, pair2: pairCD, child1: grandchild, child2: null });
    const root = makePublicBracketMatch({ pair1: pairAB, pair2: pairCD, child1, child2: null });
    const pairsOut: Pair[] = [];

    const result = mapPublicBracketMatch(root, pairsOut);
    const idsById = new Map(pairsOut.map(p => [p.id, p]));

    // root (2) + child1 (2) + grandchild (2) = 6 — every embedded pair1/pair2 id must resolve.
    expect(pairsOut.length).toBe(6);
    expect(idsById.has(result.pair1)).toBe(true);
    expect(idsById.has(result.pair2)).toBe(true);
    expect(idsById.has(result.child1!.pair1)).toBe(true);
    expect(idsById.has(result.child1!.child1!.pair1)).toBe(true);
  });

  it('should not push anything for null pair1/pair2', () => {
    const pbm = makePublicBracketMatch({ pair1: null, pair2: null });
    const pairsOut: Pair[] = [];

    mapPublicBracketMatch(pbm, pairsOut);

    expect(pairsOut.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// mapPublicClassificationBracket
// ---------------------------------------------------------------------------

describe('mapPublicClassificationBracket', () => {
  function makePublicClassificationBracket(overrides: Partial<PublicClassificationBracket> = {}): PublicClassificationBracket {
    return {
      source_round_display: 'Demi-finale',
      start_place: 3,
      end_place: 4,
      root_match: makePublicBracketMatch(),
      children: [],
      ...overrides,
    };
  }

  it('should map dimension to 0 and source_round to an empty string', () => {
    const pcb = makePublicClassificationBracket();

    const result = mapPublicClassificationBracket(pcb);

    expect(result.dimension).toBe(0);
    expect(result.source_round).toBe('');
    expect(result.source_round_display).toBe('Demi-finale');
    expect(result.start_place).toBe(3);
    expect(result.end_place).toBe(4);
  });

  it('should map root_match via mapPublicBracketMatch', () => {
    const pcb = makePublicClassificationBracket();

    const result = mapPublicClassificationBracket(pcb);

    expect(result.root_match.round).toBe('FINALE');
  });

  it('should recursively map children', () => {
    const child = makePublicClassificationBracket({ source_round_display: 'Quart', start_place: 5, end_place: 8 });
    const pcb = makePublicClassificationBracket({ children: [child] });

    const result = mapPublicClassificationBracket(pcb);

    expect(result.children.length).toBe(1);
    expect(result.children[0].source_round_display).toBe('Quart');
  });

  it('should assign a negative synthetic id', () => {
    const result = mapPublicClassificationBracket(makePublicClassificationBracket());
    expect(result.id).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// mapPublicBracketResponse
// ---------------------------------------------------------------------------

describe('mapPublicBracketResponse', () => {
  it('should map the bracket with dimension/nb_pair_round_* set to 0', () => {
    const resp = { root_match: makePublicBracketMatch(), classification_brackets: [] };

    const { bracket } = mapPublicBracketResponse(resp);

    expect(bracket.dimension).toBe(0);
    expect(bracket.nb_pair_round_64).toBe(0);
    expect(bracket.nb_pair_round_32).toBe(0);
    expect(bracket.nb_pair_round_16).toBe(0);
    expect(bracket.nb_pair_round_8).toBe(0);
    expect(bracket.nb_pair_round_4).toBe(0);
    expect(bracket.root_match.round).toBe('FINALE');
    expect(bracket.classification_brackets).toEqual([]);
  });

  it('should collect pairs from the main bracket tree', () => {
    const resp = { root_match: makePublicBracketMatch(), classification_brackets: [] };

    const { pairs } = mapPublicBracketResponse(resp);

    expect(pairs.length).toBe(2);
  });

  // Régression : pair1/pair2/winner_id embarqués dans l'arbre du bracket doivent référencer des
  // ids réellement présents dans `pairs` — sinon BracketChartComponent affiche "Paire <id>" au
  // lieu du nom des joueurs (bug constaté en prod : root_match.pair1/pair2 et `pairs` étaient
  // mintés par deux parcours indépendants de l'arbre source, donc avec des ids différents).
  it('should produce a bracket whose embedded pair ids all resolve in the returned pairs array', () => {
    const grandchild = makePublicBracketMatch({ pair1: pairAB, pair2: pairCD, winner: pairAB });
    const root = makePublicBracketMatch({ pair1: pairAB, pair2: pairCD, child1: grandchild, child2: null });
    const resp = { root_match: root, classification_brackets: [] };

    const { bracket, pairs } = mapPublicBracketResponse(resp);
    const idsById = new Set(pairs.map(p => p.id));

    expect(idsById.has(bracket.root_match.pair1)).toBe(true);
    expect(idsById.has(bracket.root_match.pair2)).toBe(true);
    expect(idsById.has(bracket.root_match.child1!.pair1)).toBe(true);
    expect(idsById.has(bracket.root_match.child1!.pair2)).toBe(true);
    expect(idsById.has(bracket.root_match.child1!.winner_id)).toBe(true);
  });

  it('should collect pairs from classification brackets, including nested children', () => {
    const classificationGrandchild = {
      source_round_display: 'Quart',
      start_place: 5,
      end_place: 8,
      root_match: makePublicBracketMatch({ pair1: pairAB, pair2: pairCD }),
      children: [] as PublicClassificationBracket[],
    };
    const classificationChild = {
      source_round_display: 'Demi-finale',
      start_place: 3,
      end_place: 4,
      root_match: makePublicBracketMatch({ pair1: pairAB, pair2: pairCD }),
      children: [classificationGrandchild],
    };
    const resp = {
      root_match: makePublicBracketMatch({ pair1: pairAB, pair2: pairCD }),
      classification_brackets: [classificationChild],
    };

    const { bracket, pairs } = mapPublicBracketResponse(resp);
    const idsById = new Set(pairs.map(p => p.id));

    expect(bracket.classification_brackets.length).toBe(1);
    expect(bracket.classification_brackets[0].children.length).toBe(1);
    // main root (2) + classification child root (2) + classification grandchild root (2) = 6
    expect(pairs.length).toBe(6);
    expect(idsById.has(bracket.classification_brackets[0].root_match.pair1)).toBe(true);
    expect(idsById.has(bracket.classification_brackets[0].children[0].root_match.pair1)).toBe(true);
  });

  it('should handle an empty bracket tree without pairs', () => {
    const resp = { root_match: makePublicBracketMatch({ pair1: null, pair2: null }), classification_brackets: [] };

    const { pairs } = mapPublicBracketResponse(resp);

    expect(pairs.length).toBe(0);
  });
});
