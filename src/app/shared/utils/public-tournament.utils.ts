import { Bracket, BracketMatch, ClassificationBracket, Match } from '../models/tournament.models';
import { Pair, Player } from '../models/pair.models';
import {
  PublicBracketMatch,
  PublicBracketResponse,
  PublicClassificationBracket,
  PublicMatch,
  PublicPair,
  PublicPlayer,
} from '../models/public-tournament.models';

// Compteur d'id synthétique : une seule variable de module, strictement négative et
// décroissante, jamais remise à zéro. L'unicité n'a besoin de tenir que pour la durée
// de vie d'une page (pas de persistance, pas de comparaison entre deux chargements), donc
// un reset entre deux appels de mapping n'apporte rien et risquerait des collisions d'id
// si plusieurs mappings cohabitent dans la même page (ex: matches + bracket).
let syntheticIdCounter = 0;

function nextSyntheticId(): number {
  syntheticIdCounter -= 1;
  return syntheticIdCounter;
}

export function mapPublicPlayer(p: PublicPlayer): Player {
  return {
    id: nextSyntheticId(),
    last_name: p.last_name,
    first_name: p.first_name,
    license_number: '',
    ranking: p.ranking,
  };
}

export function mapPublicPair(p: PublicPair | null): Pair | undefined {
  if (!p) return undefined;
  return {
    id: nextSyntheticId(),
    player1: mapPublicPlayer(p.player1),
    player2: mapPublicPlayer(p.player2),
    weight: p.weight,
  };
}

function samePublicPlayer(a: PublicPlayer, b: PublicPlayer): boolean {
  return a.first_name === b.first_name && a.last_name === b.last_name;
}

function samePublicPair(a: PublicPair, b: PublicPair): boolean {
  return samePublicPlayer(a.player1, b.player1) && samePublicPlayer(a.player2, b.player2);
}

/**
 * Résout l'id synthétique du gagnant en comparant `winner` PAR VALEUR (prénom+nom des 2
 * joueurs) aux paires brutes `rawPair1`/`rawPair2` du même match — jamais un 3e id
 * synthétique n'est attribué au gagnant, on réutilise celui déjà attribué à pair1 ou pair2.
 */
function resolveWinnerId(
  winner: PublicPair | null,
  rawPair1: PublicPair | null,
  rawPair2: PublicPair | null,
  mappedPair1: Pair | undefined,
  mappedPair2: Pair | undefined,
): number {
  if (!winner) return 0;
  if (rawPair1 && samePublicPair(winner, rawPair1) && mappedPair1) return mappedPair1.id;
  if (rawPair2 && samePublicPair(winner, rawPair2) && mappedPair2) return mappedPair2.id;
  return 0;
}

export function mapPublicMatch(pm: PublicMatch): { match: Match; pair1: Pair | undefined; pair2: Pair | undefined } {
  const pair1 = mapPublicPair(pm.pair1);
  const pair2 = mapPublicPair(pm.pair2);
  const winner_id = resolveWinnerId(pm.winner, pm.pair1, pm.pair2, pair1, pair2);

  const match: Match = {
    id: nextSyntheticId(),
    round: pm.round,
    round_display: pm.round_display,
    match_number: pm.match_number,
    order: pm.order,
    pair1: pair1?.id ?? null,
    pair2: pair2?.id ?? null,
    game_format: pm.game_format,
    score: pm.score,
    winner_id,
    status: pm.status,
    finished_at: pm.finished_at ?? '',
    started_at: pm.started_at,
    estimated_start_at: pm.estimated_start_at,
  };

  return { match, pair1, pair2 };
}

// `pairsOut` est alimenté en EFFET DE BORD par cette même fonction, pendant l'unique parcours
// de l'arbre source — la liste des paires doit provenir de cette traversée et d'aucune autre,
// sinon les ids synthétiques mintés ici (pair1/pair2/winner_id) ne correspondraient pas aux ids
// d'un éventuel second parcours indépendant (mapPublicPair mintant un nouvel id à chaque appel).
export function mapPublicBracketMatch(pbm: PublicBracketMatch, pairsOut: Pair[] = []): BracketMatch {
  const pair1 = mapPublicPair(pbm.pair1);
  const pair2 = mapPublicPair(pbm.pair2);
  if (pair1) pairsOut.push(pair1);
  if (pair2) pairsOut.push(pair2);
  const winner_id = resolveWinnerId(pbm.winner, pbm.pair1, pbm.pair2, pair1, pair2);

  return {
    id: nextSyntheticId(),
    round: pbm.round,
    round_display: pbm.round_display,
    match_number: pbm.match_number,
    // 0 est la sentinelle "pas de paire" pour BracketMatch.pair1/pair2 (type number non
    // nullable, contrairement à Match.pair1/pair2) : sûr car BracketChartComponent teste
    // la présence via `@if (slot.pairId)`, falsy sur 0, jamais via `=== null`.
    pair1: pair1?.id ?? 0,
    pair2: pair2?.id ?? 0,
    game_format: pbm.game_format,
    score: pbm.score,
    winner_id,
    child1: pbm.child1 ? mapPublicBracketMatch(pbm.child1, pairsOut) : (null as unknown as BracketMatch),
    child2: pbm.child2 ? mapPublicBracketMatch(pbm.child2, pairsOut) : (null as unknown as BracketMatch),
    disabled: pbm.disabled,
    pair1_can_be_placed: false,
    pair2_can_be_placed: false,
    status: pbm.status,
    finished_at: pbm.finished_at ?? '',
  };
}

export function mapPublicClassificationBracket(
  pcb: PublicClassificationBracket,
  pairsOut: Pair[] = [],
): ClassificationBracket {
  return {
    id: nextSyntheticId(),
    dimension: 0,
    source_round: '',
    source_round_display: pcb.source_round_display,
    start_place: pcb.start_place,
    end_place: pcb.end_place,
    root_match: mapPublicBracketMatch(pcb.root_match, pairsOut),
    children: pcb.children.map(child => mapPublicClassificationBracket(child, pairsOut)),
  };
}

export function mapPublicBracketResponse(resp: PublicBracketResponse): { bracket: Bracket; pairs: Pair[] } {
  const pairs: Pair[] = [];

  const bracket: Bracket = {
    id: nextSyntheticId(),
    dimension: 0,
    nb_pair_round_64: 0,
    nb_pair_round_32: 0,
    nb_pair_round_16: 0,
    nb_pair_round_8: 0,
    nb_pair_round_4: 0,
    root_match: mapPublicBracketMatch(resp.root_match, pairs),
    classification_brackets: resp.classification_brackets.map(pcb => mapPublicClassificationBracket(pcb, pairs)),
  };

  return { bracket, pairs };
}
