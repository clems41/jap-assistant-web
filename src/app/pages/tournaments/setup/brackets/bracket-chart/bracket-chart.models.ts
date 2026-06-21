import { BracketMatch } from '../../../../../shared/models/tournament.models';

export enum SlotState {
  Bypassed,
  WaitingForWinner,
  Interactive,
}

export interface PairSlot {
  id: string;
  pairId: number | null;
  x: number;
  y: number;
  isWinner: boolean;
  isChampion: boolean;
  state: SlotState;
  roundSize: number;
}

export interface MatchJunction {
  match: BracketMatch;
  x: number;
  y: number;
}

export interface Connector {
  id: string;
  path: string;
  isWinner: boolean;
}

export interface RoundHeader {
  label: string;
  x: number;
}

export interface BracketLayout {
  pairSlots: PairSlot[];
  junctions: MatchJunction[];
  connectors: Connector[];
  roundHeaders: RoundHeader[];
  totalWidth: number;
  totalHeight: number;
}

export const PAIR_W = 140;
export const PAIR_H = 52;
export const CELL_H = 64;
export const COL_GAP = 80;
export const HEADER_HEIGHT = 40;
export const PRINT_PAGE_WIDTH = 1000;

// Hauteur imprimable budgétée pour une page A4 paysage (≈718px réels à 96dpi pour une marge de
// 10mm), en laissant de la marge pour le titre de section affiché au-dessus du tableau.
export const PRINT_PAGE_HEIGHT = 680;

// Échelle minimale en dessous de laquelle le texte est jugé trop petit pour rester lisible sur
// papier — calibrée pour qu'un tableau de dimension 32 se découpe en 2 pages de détail + 1 page
// "Phase finale" (cf. exemple validé avec l'utilisateur).
export const MIN_PRINT_SCALE = 0.6;

export function getDepth(match: BracketMatch | null): number {
  if (!match) return 0;
  return 1 + Math.max(getDepth(match.child1), getDepth(match.child2));
}

export function countLeaves(match: BracketMatch | null, maxDepth = Infinity, depth = 0): number {
  if (!match) return 0;
  if ((!match.child1 && !match.child2) || depth >= maxDepth) return 1;
  return countLeaves(match.child1, maxDepth, depth + 1) + countLeaves(match.child2, maxDepth, depth + 1);
}

export interface ComputeLayoutOptions {
  // Tronque la récursion : un match à depth >= maxDepth est rendu comme une simple boîte
  // (ses propres pair1/pair2/winner_id, déjà connus par promotion), sans descendre plus loin.
  maxDepth?: number;
  // Si false, omet le slot/connecteur synthétique "champion" — utilisé pour une page de section
  // dont la racine locale n'est pas le véritable vainqueur du tableau.
  includeChampion?: boolean;
  // Libellé du badge champion (dépend du mode d'affichage), utilisé seulement si includeChampion.
  championLabel?: string;
}

export function computeLayout(root: BracketMatch, options?: ComputeLayoutOptions): BracketLayout {
  const maxDepth = options?.maxDepth ?? Infinity;
  const includeChampion = options?.includeChampion ?? true;

  const pairSlots: PairSlot[] = [];
  const junctions: MatchJunction[] = [];
  const connectors: BracketLayout['connectors'] = [];
  const roundDisplayByDepth = new Map<number, string>();

  // D représente la profondeur de la colonne la plus à gauche (les feuilles, réelles ou
  // tronquées). Quand la récursion est tronquée à maxDepth, cette profondeur EST maxDepth — ce
  // n'est plus dérivable de getDepth(root), qui mesurerait la profondeur réelle (non tronquée).
  const D = options?.maxDepth !== undefined ? options.maxDepth : getDepth(root) - 1;
  const numLeaves = countLeaves(root, maxDepth);
  const bracketHeight = numLeaves * 2 * CELL_H;

  const colX = (d: number) => (D - d) * (PAIR_W + COL_GAP);
  const junX = (d: number) => colX(d) + PAIR_W + COL_GAP / 2;

  const slotState = (disabled: boolean, canBePlaced: boolean): SlotState =>
    disabled ? SlotState.Bypassed
      : canBePlaced ? SlotState.Interactive
      : SlotState.WaitingForWinner;

  const layout = (match: BracketMatch, d: number, topY: number, allocH: number): number => {
    const pairX = colX(d);
    const pairRightX = pairX + PAIR_W;
    const junctionX = junX(d);

    roundDisplayByDepth.set(d, match.round_display);

    const isLeaf = (!match.child1 && !match.child2) || d >= maxDepth;

    let pair1Y: number;
    let pair2Y: number;

    if (isLeaf) {
      pair1Y = topY + allocH / 4;
      pair2Y = topY + 3 * allocH / 4;
    } else {
      pair1Y = layout(match.child1, d + 1, topY, allocH / 2);
      pair2Y = layout(match.child2, d + 1, topY + allocH / 2, allocH / 2);
    }

    const junctionY = (pair1Y + pair2Y) / 2;
    const pair1Wins = !!match.winner_id && match.winner_id === match.pair1;
    const pair2Wins = !!match.winner_id && match.winner_id === match.pair2;

    const yOffset = HEADER_HEIGHT;
    const roundSize = 2 ** (d + 1);
    pairSlots.push({ id: `${match.id}-p1`, pairId: match.pair1 ?? null, x: pairX, y: pair1Y + yOffset, isWinner: pair1Wins, isChampion: false, state: slotState(match.disabled, match.pair1_can_be_placed), roundSize });
    pairSlots.push({ id: `${match.id}-p2`, pairId: match.pair2 ?? null, x: pairX, y: pair2Y + yOffset, isWinner: pair2Wins, isChampion: false, state: slotState(match.disabled, match.pair2_can_be_placed), roundSize });
    junctions.push({ match, x: junctionX, y: junctionY + yOffset });

    connectors.push({ id: `${match.id}-cp1`, path: `M ${pairRightX} ${pair1Y + yOffset} H ${junctionX} V ${junctionY + yOffset}`, isWinner: pair1Wins });
    connectors.push({ id: `${match.id}-cp2`, path: `M ${pairRightX} ${pair2Y + yOffset} H ${junctionX} V ${junctionY + yOffset}`, isWinner: pair2Wins });
    if (!isLeaf) {
      if (match.child1) {
        connectors.push({ id: `${match.id}-cj1`, path: `M ${junX(d + 1)} ${pair1Y + yOffset} H ${pairX}`, isWinner: pair1Wins });
      }
      if (match.child2) {
        connectors.push({ id: `${match.id}-cj2`, path: `M ${junX(d + 1)} ${pair2Y + yOffset} H ${pairX}`, isWinner: pair2Wins });
      }
    }

    return junctionY;
  };

  const rootJunctionY = layout(root, 0, 0, bracketHeight);

  const lastColX = colX(0);
  const roundHeaders: BracketLayout['roundHeaders'] = [];
  for (const [d, label] of roundDisplayByDepth) {
    roundHeaders.push({ label, x: colX(d) + PAIR_W / 2 });
  }
  roundHeaders.sort((a, b) => a.x - b.x);

  let totalWidth = lastColX + PAIR_W + 20;

  if (includeChampion) {
    const championX = lastColX + (PAIR_W + COL_GAP);
    pairSlots.push({ id: `champion-${root.id}`, pairId: root.winner_id ?? null, x: championX, y: rootJunctionY + HEADER_HEIGHT, isWinner: false, isChampion: true, state: SlotState.Interactive, roundSize: 0 });
    connectors.push({ id: `${root.id}-cc`, path: `M ${junX(0)} ${rootJunctionY + HEADER_HEIGHT} H ${championX}`, isWinner: !!root.winner_id });
    roundHeaders.push({ label: options?.championLabel ?? 'Gagnant', x: championX + PAIR_W / 2 });
    totalWidth = championX + PAIR_W + 20;
  }

  return {
    pairSlots,
    junctions,
    connectors,
    roundHeaders,
    totalWidth,
    totalHeight: bracketHeight + HEADER_HEIGHT,
  };
}

export function fitScale(width: number, height: number): number {
  return Math.min(1, PRINT_PAGE_WIDTH / (width || 1), PRINT_PAGE_HEIGHT / (height || 1));
}

export function scalePath(path: string, scale: number): string {
  return path.replace(/-?\d+(\.\d+)?/g, token => (parseFloat(token) * scale).toFixed(2));
}

export function scaleLayout(layout: BracketLayout, scale: number): BracketLayout {
  return {
    pairSlots: layout.pairSlots.map(s => ({ ...s, x: s.x * scale, y: s.y * scale })),
    junctions: layout.junctions.map(j => ({ ...j, x: j.x * scale, y: j.y * scale })),
    connectors: layout.connectors.map(c => ({ ...c, path: scalePath(c.path, scale) })),
    roundHeaders: layout.roundHeaders.map(h => ({ ...h, x: h.x * scale })),
    totalWidth: layout.totalWidth * scale,
    totalHeight: layout.totalHeight * scale,
  };
}

export interface PrintSection {
  layout: BracketLayout;
  // Multiplicateur appliqué côté template à PAIR_W / PAIR_H / HEADER_HEIGHT pour les dimensions
  // de boîte — les coordonnées dans `layout` sont déjà mises à l'échelle, mais pas ces constantes
  // partagées (pour ne pas les dupliquer dans BracketLayout).
  scale: number;
  title: string;
  isFinalSection: boolean;
}

// Descend par la branche réellement la plus profonde (utile sur un arbre déséquilibré avec byes,
// où child1 n'est pas forcément la branche la plus profonde).
export function deepestRoundDisplay(match: BracketMatch): string {
  const d1 = getDepth(match.child1);
  const d2 = getDepth(match.child2);
  if (d1 === 0 && d2 === 0) return match.round_display;
  return d1 >= d2 ? deepestRoundDisplay(match.child1) : deepestRoundDisplay(match.child2);
}

export function buildDetailTitle(sectionRoot: BracketMatch, index: number, total: number): string {
  return `Partie ${index + 1}/${total} (${deepestRoundDisplay(sectionRoot)} → ${sectionRoot.round_display})`;
}

export function buildFinaleTitle(root: BracketMatch, sectionRoots: BracketMatch[]): string {
  const deepestLabel = sectionRoots[0]?.round_display ?? root.round_display;
  return `Phase finale (${deepestLabel} → ${root.round_display})`;
}

// Collecte les racines des sous-arbres complets à la profondeur k depuis `match` (k=1 → les 2
// enfants directs, k=2 → les 4 petits-enfants, etc.). Une branche qui atteint une vraie feuille
// avant la profondeur k devient sa propre section sans attendre ses sœurs — ce qui gère
// nativement les arbres déséquilibrés (byes).
export function collectSectionRoots(match: BracketMatch, k: number, depth = 0, out: BracketMatch[] = []): BracketMatch[] {
  const isRealLeaf = !match.child1 && !match.child2;
  if (isRealLeaf || depth >= k) {
    out.push(match);
  } else {
    collectSectionRoots(match.child1, k, depth + 1, out);
    collectSectionRoots(match.child2, k, depth + 1, out);
  }
  return out;
}

function buildSinglePageSection(root: BracketMatch, layout: BracketLayout, scale: number): PrintSection {
  return {
    layout: scaleLayout(layout, scale),
    scale,
    title: `Tableau principal (${deepestRoundDisplay(root)} → ${root.round_display})`,
    isFinalSection: true,
  };
}

// Découpe un tableau en pages imprimables : soit une seule page si tout rentre, soit des pages de
// détail (un sous-arbre complet chacune, jamais de match coupé) + une page "Phase finale" séparée
// pour les rounds qui convergent (demies, finale, champion).
export function buildPrintSections(root: BracketMatch, championLabel: string): PrintSection[] {
  const fullLayout = computeLayout(root, { includeChampion: true, championLabel });
  const fullScale = fitScale(fullLayout.totalWidth, fullLayout.totalHeight);
  if (fullScale >= MIN_PRINT_SCALE) {
    return [buildSinglePageSection(root, fullLayout, fullScale)];
  }

  const maxK = getDepth(root);
  for (let k = 1; k <= maxK; k++) {
    const sectionRoots = collectSectionRoots(root, k);
    const upperLayout = computeLayout(root, { maxDepth: k, includeChampion: true, championLabel });
    const upperScale = fitScale(upperLayout.totalWidth, upperLayout.totalHeight);
    if (upperScale < MIN_PRINT_SCALE) continue;

    const sectionLayouts = sectionRoots.map(sr => computeLayout(sr, { includeChampion: false }));
    const sectionScales = sectionLayouts.map(l => fitScale(l.totalWidth, l.totalHeight));
    if (sectionScales.some(s => s < MIN_PRINT_SCALE)) continue;

    return [
      ...sectionRoots.map((sr, i) => ({
        layout: scaleLayout(sectionLayouts[i], sectionScales[i]),
        scale: sectionScales[i],
        title: buildDetailTitle(sr, i, sectionRoots.length),
        isFinalSection: false,
      })),
      {
        layout: scaleLayout(upperLayout, upperScale),
        scale: upperScale,
        title: buildFinaleTitle(root, sectionRoots),
        isFinalSection: true,
      },
    ];
  }

  // Filet de sécurité (ne devrait jamais être atteint pour les dimensions 4/8/16/32/64) : on
  // imprime tout de même, à la plus petite échelle calculée plutôt que de ne rien produire.
  return [buildSinglePageSection(root, fullLayout, fullScale)];
}
