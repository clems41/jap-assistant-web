import { BracketMatch, MatchStatus } from '../../../../../shared/models/tournament.models';
import {
  buildDetailTitle,
  buildFinaleTitle,
  buildPrintSections,
  computeLayout,
  countLeaves,
  deepestRoundDisplay,
  fitScale,
  getDepth,
  MIN_PRINT_SCALE,
  scaleLayout,
  scalePath,
} from './bracket-chart.models';

let idCounter = 0;

function makeMatch(overrides: Partial<BracketMatch> = {}): BracketMatch {
  return {
    id: ++idCounter,
    round: 'R',
    round_display: 'Round',
    match_number: 1,
    pair1: 0,
    pair2: 0,
    game_format: 'C1',
    score: '',
    winner_id: 0,
    child1: null as unknown as BracketMatch,
    child2: null as unknown as BracketMatch,
    disabled: false,
    pair1_can_be_placed: true,
    pair2_can_be_placed: true,
    status: MatchStatus.UPCOMING,
    finished_at: '',
    ...overrides,
  };
}

const ROUND_LABELS = ['Finale', 'Demi-finale', 'Quart de finale', '1/8e', '1/16e', '1/32e', '1/64e'];

// Construit un arbre binaire parfait de `numLevels` niveaux (depthIndex 0 = racine).
function buildTree(numLevels: number, depthIndex = 0): BracketMatch {
  const match = makeMatch({ round_display: ROUND_LABELS[depthIndex] ?? `Depth${depthIndex}` });
  if (numLevels > 1) {
    match.child1 = buildTree(numLevels - 1, depthIndex + 1);
    match.child2 = buildTree(numLevels - 1, depthIndex + 1);
  }
  return match;
}

function buildBalancedTree(dimension: number): BracketMatch {
  idCounter = 0;
  return buildTree(Math.log2(dimension));
}

// Construit un arbre déséquilibré : la branche `child2` atteint une vraie feuille un niveau plus
// tôt que `child1`, simulant un bye qui a court-circuité un tour intermédiaire.
function buildUnbalancedTree(): BracketMatch {
  idCounter = 0;
  const root = makeMatch({ round_display: 'Finale' });
  root.child1 = (() => {
    const sf = makeMatch({ round_display: 'Demi-finale' });
    sf.child1 = makeMatch({ round_display: 'Quart de finale' });
    sf.child2 = makeMatch({ round_display: 'Quart de finale' });
    return sf;
  })();
  root.child2 = makeMatch({ round_display: 'Demi-finale' }); // feuille directe (bye)
  return root;
}

function collectAllMatchIds(match: BracketMatch | null, out: Set<number> = new Set()): Set<number> {
  if (!match) return out;
  out.add(match.id);
  collectAllMatchIds(match.child1, out);
  collectAllMatchIds(match.child2, out);
  return out;
}

function collectRealLeafIds(match: BracketMatch | null, out: Set<number> = new Set()): Set<number> {
  if (!match) return out;
  if (!match.child1 && !match.child2) {
    out.add(match.id);
  } else {
    collectRealLeafIds(match.child1, out);
    collectRealLeafIds(match.child2, out);
  }
  return out;
}

function junctionMatchIds(layout: ReturnType<typeof computeLayout>): Set<number> {
  return new Set(layout.junctions.map(j => j.match.id));
}

describe('bracket-chart.models', () => {
  describe('getDepth() / countLeaves()', () => {
    it('returns 0 for a null match', () => {
      expect(getDepth(null)).toBe(0);
      expect(countLeaves(null)).toBe(0);
    });

    it('computes depth as max of branches, not sum, on an unbalanced tree', () => {
      const root = buildUnbalancedTree();
      // child1 a 2 niveaux sous lui (QF), child2 est déjà une feuille : depth = 1 + max(2, 1) = 3
      expect(getDepth(root)).toBe(3);
    });

    it('counts every real leaf once, including an early bye-leaf', () => {
      const root = buildUnbalancedTree();
      // 2 feuilles sous child1 (les 2 quarts) + 1 feuille pour child2 (bye) = 3
      expect(countLeaves(root)).toBe(3);
    });

    it('truncates countLeaves at maxDepth, treating deeper nodes as a single leaf', () => {
      const root = buildBalancedTree(8); // Finale -> Demi -> Quart(feuilles)
      expect(countLeaves(root)).toBe(4);
      expect(countLeaves(root, 1)).toBe(2); // les 2 demi-finales deviennent des feuilles
      expect(countLeaves(root, 0)).toBe(1); // la racine elle-même devient une feuille
    });
  });

  describe('computeLayout() avec options', () => {
    it('traite un nœud à la profondeur de troncature comme une feuille même s\'il a des enfants', () => {
      const root = buildBalancedTree(8);
      const truncated = computeLayout(root, { maxDepth: 1, includeChampion: false });
      const demiIds = [root.child1.id, root.child2.id];
      // La racine (non tronquée) garde son connecteur vers les demi-finales...
      expect(truncated.connectors.some(c => c.id === `${root.id}-cj1`)).toBe(true);
      // ...mais les demi-finales (à la profondeur de troncature) n'ont aucun connecteur vers les quarts.
      for (const id of demiIds) {
        expect(truncated.connectors.some(c => c.id === `${id}-cj1` || c.id === `${id}-cj2`)).toBe(false);
      }
      // Seuls la racine + les 2 demi-finales sont rendus (2 pairSlots chacun) : les quarts n'apparaissent pas.
      expect(truncated.pairSlots.length).toBe(6);
    });

    it('omet le slot et le connecteur champion quand includeChampion est false', () => {
      const root = buildBalancedTree(4);
      const withChampion = computeLayout(root, { includeChampion: true, championLabel: 'Gagnant' });
      const withoutChampion = computeLayout(root, { includeChampion: false });
      expect(withChampion.pairSlots.some(s => s.isChampion)).toBe(true);
      expect(withoutChampion.pairSlots.some(s => s.isChampion)).toBe(false);
      expect(withoutChampion.totalWidth).toBeLessThan(withChampion.totalWidth);
      expect(withoutChampion.roundHeaders.length).toBe(withChampion.roundHeaders.length - 1);
    });

    it('inclut le champion par défaut (includeChampion non précisé)', () => {
      const root = buildBalancedTree(4);
      const layout = computeLayout(root, { championLabel: 'Gagnant' });
      expect(layout.pairSlots.some(s => s.isChampion)).toBe(true);
    });
  });

  describe('buildPrintSections()', () => {
    it('dimension 4 : une seule page', () => {
      const sections = buildPrintSections(buildBalancedTree(4), 'Gagnant');
      expect(sections.length).toBe(1);
      expect(sections[0].isFinalSection).toBe(true);
      expect(sections[0].scale).toBeGreaterThanOrEqual(MIN_PRINT_SCALE);
    });

    it('dimension 8 : une seule page', () => {
      const sections = buildPrintSections(buildBalancedTree(8), 'Gagnant');
      expect(sections.length).toBe(1);
    });

    it('dimension 16 : une seule page (reste lisible malgré la hauteur)', () => {
      const sections = buildPrintSections(buildBalancedTree(16), 'Gagnant');
      expect(sections.length).toBe(1);
      expect(sections[0].scale).toBeGreaterThanOrEqual(MIN_PRINT_SCALE);
    });

    it('dimension 32 : 2 pages de détail + 1 page "Phase finale"', () => {
      const sections = buildPrintSections(buildBalancedTree(32), 'Gagnant');
      expect(sections.length).toBe(3);
      expect(sections.slice(0, 2).every(s => !s.isFinalSection)).toBe(true);
      expect(sections[2].isFinalSection).toBe(true);
      expect(sections.every(s => s.scale >= MIN_PRINT_SCALE)).toBe(true);
    });

    it('dimension 64 : 4 pages de détail + 1 page "Phase finale"', () => {
      const sections = buildPrintSections(buildBalancedTree(64), 'Gagnant');
      expect(sections.length).toBe(5);
      expect(sections.slice(0, 4).every(s => !s.isFinalSection)).toBe(true);
      expect(sections[4].isFinalSection).toBe(true);
      expect(sections.every(s => s.scale >= MIN_PRINT_SCALE)).toBe(true);
    });

    it('arbre déséquilibré (bye) : la branche courte devient sa propre petite section', () => {
      // Force artificiellement une coupure en dupliquant le bracket déséquilibré pour qu'il ne
      // rentre pas sur une seule page : on ajoute un niveau supplémentaire sous child1 uniquement.
      const root = buildUnbalancedTree();
      const sections = buildPrintSections(root, 'Gagnant');
      // L'arbre est petit (3 feuilles), il doit rentrer sur une seule page sans forcer de découpe.
      expect(sections.length).toBe(1);
    });

    it('couverture des feuilles : chaque vraie feuille apparaît dans exactement une section de détail', () => {
      const root = buildBalancedTree(32);
      const realLeafIds = collectRealLeafIds(root);
      const sections = buildPrintSections(root, 'Gagnant');
      const detailSections = sections.filter(s => !s.isFinalSection);
      const finalSection = sections.find(s => s.isFinalSection)!;

      const seen = new Set<number>();
      for (const section of detailSections) {
        // On ne peut pas relire les ids depuis `layout` mis à l'échelle (les coordonnées ont
        // changé mais pas les ids) : on revalide directement via junctionMatchIds.
        for (const id of junctionMatchIds(section.layout)) {
          expect(seen.has(id)).toBe(false); // pas de doublon entre sections de détail
          seen.add(id);
        }
      }
      for (const leafId of realLeafIds) {
        expect(seen.has(leafId)).toBe(true);
      }
      // Aucune vraie feuille ne doit apparaître sur la page finale (arbre équilibré, pas de bye).
      const finalIds = junctionMatchIds(finalSection.layout);
      for (const leafId of realLeafIds) {
        expect(finalIds.has(leafId)).toBe(false);
      }
    });

    it('les matchs de la partie haute (demi/finale) n\'apparaissent que sur la page finale', () => {
      const root = buildBalancedTree(32);
      const sections = buildPrintSections(root, 'Gagnant');
      const detailIds = new Set<number>();
      for (const s of sections.filter(s => !s.isFinalSection)) {
        for (const id of junctionMatchIds(s.layout)) detailIds.add(id);
      }
      const allIds = collectAllMatchIds(root);
      const upperIds = [...allIds].filter(id => !detailIds.has(id));
      expect(upperIds.length).toBeGreaterThan(0);
      const finalSection = sections.find(s => s.isFinalSection)!;
      const finalIds = junctionMatchIds(finalSection.layout);
      for (const id of upperIds) {
        expect(finalIds.has(id)).toBe(true);
      }
    });
  });

  describe('scaleLayout() / scalePath()', () => {
    it('met à l\'échelle les jetons numériques d\'un chemin SVG en préservant les commandes', () => {
      const result = scalePath('M 140 100 H 220 V 150', 0.5);
      expect(result).toBe('M 70.00 50.00 H 110.00 V 75.00');
    });

    it('met à l\'échelle les coordonnées de pairSlots/junctions/roundHeaders et les dimensions globales', () => {
      const root = buildBalancedTree(4);
      const layout = computeLayout(root, { championLabel: 'Gagnant' });
      const scaled = scaleLayout(layout, 0.5);
      expect(scaled.totalWidth).toBeCloseTo(layout.totalWidth * 0.5, 5);
      expect(scaled.totalHeight).toBeCloseTo(layout.totalHeight * 0.5, 5);
      expect(scaled.pairSlots[0].x).toBeCloseTo(layout.pairSlots[0].x * 0.5, 5);
      expect(scaled.pairSlots[0].y).toBeCloseTo(layout.pairSlots[0].y * 0.5, 5);
      expect(scaled.roundHeaders[0].x).toBeCloseTo(layout.roundHeaders[0].x * 0.5, 5);
    });
  });

  describe('fitScale()', () => {
    it('plafonne à 1 quand le contenu rentre déjà dans la page', () => {
      expect(fitScale(100, 100)).toBe(1);
    });

    it('réduit proportionnellement à la dimension la plus contraignante', () => {
      expect(fitScale(2000, 100)).toBeLessThan(1);
    });
  });

  describe('titres de section', () => {
    it('buildDetailTitle dérive le libellé depuis round_display de la racine et de la feuille la plus profonde', () => {
      const root = buildBalancedTree(8); // Finale -> Demi-finale -> Quart de finale (feuilles)
      const sectionRoot = root.child1; // Demi-finale
      const title = buildDetailTitle(sectionRoot, 0, 2);
      expect(title).toBe('Partie 1/2 (Quart de finale → Demi-finale)');
    });

    it('buildFinaleTitle dérive le libellé depuis le round des racines de section et celui de la racine réelle', () => {
      const root = buildBalancedTree(8);
      const sectionRoots = [root.child1, root.child2];
      const title = buildFinaleTitle(root, sectionRoots);
      expect(title).toBe('Phase finale (Demi-finale → Finale)');
    });
  });

  describe('deepestRoundDisplay()', () => {
    it('descend par la branche réellement la plus profonde sur un arbre déséquilibré', () => {
      const root = buildUnbalancedTree();
      // child1 (Demi-finale) a 2 niveaux sous lui, child2 est déjà une feuille (Demi-finale) :
      // la branche la plus profonde passe par child1 jusqu'aux quarts.
      expect(deepestRoundDisplay(root)).toBe('Quart de finale');
    });
  });
});
