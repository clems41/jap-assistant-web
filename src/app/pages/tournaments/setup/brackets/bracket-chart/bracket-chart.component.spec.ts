import { TestBed } from '@angular/core/testing';
import { BracketChartComponent } from './bracket-chart.component';
import { BracketBase, BracketMatch, MatchStatus, Tournament, TournamentStatus } from '../../../../../shared/models/tournament.models';
import { Pair, Player } from '../../../../../shared/models/pair.models';

const ROUND_LABELS = ['Finale', 'Demi-finale', 'Quart de finale', '1/8e', '1/16e'];

let idCounter = 0;
let pairIdCounter = 0;

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

// Construit un tableau de dimension 32 entièrement joué : chaque feuille a 2 paires distinctes,
// chaque match parent reçoit les vainqueurs de ses enfants (pair1 gagne systématiquement), pour
// pouvoir vérifier le rendu des pages "Phase finale" avec de vraies paires promues.
function buildPlayedTree(numLevels: number, depthIndex = 0): BracketMatch {
  const match = makeMatch({ round_display: ROUND_LABELS[depthIndex] ?? `Depth${depthIndex}` });
  if (numLevels > 1) {
    match.child1 = buildPlayedTree(numLevels - 1, depthIndex + 1);
    match.child2 = buildPlayedTree(numLevels - 1, depthIndex + 1);
    match.pair1 = match.child1.winner_id;
    match.pair2 = match.child2.winner_id;
  } else {
    match.pair1 = ++pairIdCounter;
    match.pair2 = ++pairIdCounter;
  }
  match.winner_id = match.pair1;
  match.status = MatchStatus.FINISHED;
  match.score = '6-3 6-2';
  return match;
}

function makePlayer(id: number, lastName: string): Player {
  return { id, last_name: lastName, first_name: 'Prenom', license_number: `LIC${id}`, ranking: null };
}

function buildPairs(count: number): Pair[] {
  return Array.from({ length: count }, (_, i) => {
    const id = i + 1;
    return {
      id,
      player1: makePlayer(id * 2, `Nom${id}A`),
      player2: makePlayer(id * 2 + 1, `Nom${id}B`),
      weight: null,
    };
  });
}

const mockTournament: Tournament = {
  id: 1,
  owner: 1,
  name: 'Tournoi Test',
  category: 'P100',
  start_date: '2026-04-15',
  location: 'Lyon',
  league: 'Auvergne-Rhône-Alpes',
  gender: 'Homme',
  status: TournamentStatus.STARTED,
  game_format: 'C1',
  configuration: 'POULES',
  estimated_match_duration: 60,
  pairs_count: 32,
  qr_code_url: 'https://example.com/public/tournaments/ABCDEF',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('BracketChartComponent — impression multi-pages', () => {
  beforeEach(() => {
    idCounter = 0;
    pairIdCounter = 0;
    TestBed.configureTestingModule({
      imports: [BracketChartComponent],
    });
  });

  it('dimension 32 : génère 3 sections d\'impression (2 parties + 1 phase finale) dans le DOM', () => {
    const fixture = TestBed.createComponent(BracketChartComponent);
    const rootMatch = buildPlayedTree(5); // log2(32) = 5 niveaux
    const bracket: BracketBase = { id: 1, dimension: 32, root_match: rootMatch };

    fixture.componentRef.setInput('bracket', bracket);
    fixture.componentRef.setInput('tournament', mockTournament);
    fixture.componentRef.setInput('pairs', buildPairs(32));
    fixture.componentRef.setInput('mode', 'placement');
    fixture.detectChanges();

    expect(fixture.componentInstance.printSections().length).toBe(3);

    const printArea: HTMLElement = fixture.nativeElement.querySelector('#printSectionsArea');
    expect(printArea).toBeTruthy();

    const sections = printArea.querySelectorAll(':scope > .break-inside-avoid');
    expect(sections.length).toBe(3);

    // Chaque section a son propre titre + en-tête de colonnes (pas seulement la première).
    for (const section of Array.from(sections)) {
      const title = section.querySelector('h2');
      expect(title?.textContent?.trim()).toBeTruthy();
      const headerLabels = section.querySelectorAll('.text-primary-100.font-bold');
      expect(headerLabels.length).toBeGreaterThan(0);
    }

    // Les 2 premières sections doivent forcer un saut de page après elles, pas la dernière.
    expect(sections[0].classList.contains('break-after-page')).toBe(true);
    expect(sections[1].classList.contains('break-after-page')).toBe(true);
    expect(sections[2].classList.contains('break-after-page')).toBe(false);

    // Aucune position calculée ne doit être NaN (bug de calcul d'échelle).
    const positioned = printArea.querySelectorAll<HTMLElement>('[style*="left"]');
    expect(positioned.length).toBeGreaterThan(0);
    for (const el of Array.from(positioned)) {
      expect(el.style.left.includes('NaN')).toBe(false);
      expect(el.style.top.includes('NaN')).toBe(false);
    }

    // Le nom d'une paire de la première feuille du tableau doit apparaître dans la 1ère section.
    expect(sections[0].textContent).toContain('Nom1A');
  });

  describe('interactive=false (mode lecture seule, ex. accès public)', () => {
    function setupAllPlacedFixture() {
      const fixture = TestBed.createComponent(BracketChartComponent);
      const rootMatch = buildPlayedTree(3); // dimension 8, entièrement joué, toutes les paires placées
      const bracket: BracketBase = { id: 10, dimension: 8, root_match: rootMatch };

      fixture.componentRef.setInput('bracket', bracket);
      fixture.componentRef.setInput('tournament', { status: TournamentStatus.STARTED });
      fixture.componentRef.setInput('pairs', buildPairs(8));
      fixture.componentRef.setInput('mode', 'placement');
      fixture.componentRef.setInput('interactive', false);
      fixture.detectChanges();
      return fixture;
    }

    it('onMatchClick ne change pas selectedMatch (no-op) quand interactive=false', () => {
      const fixture = setupAllPlacedFixture();
      const someMatch = fixture.componentInstance.bracket().root_match;

      fixture.componentInstance.onMatchClick(someMatch);

      expect(fixture.componentInstance.selectedMatch()).toBeNull();
    });

    it('onMatchClick change bien selectedMatch quand interactive=true (comportement par défaut inchangé)', () => {
      const fixture = TestBed.createComponent(BracketChartComponent);
      const rootMatch = buildPlayedTree(3);
      const bracket: BracketBase = { id: 11, dimension: 8, root_match: rootMatch };
      fixture.componentRef.setInput('bracket', bracket);
      fixture.componentRef.setInput('tournament', { status: TournamentStatus.STARTED });
      fixture.componentRef.setInput('pairs', buildPairs(8));
      fixture.componentRef.setInput('mode', 'placement');
      fixture.detectChanges();

      fixture.componentInstance.onMatchClick(rootMatch);

      expect(fixture.componentInstance.selectedMatch()).toBe(rootMatch);
    });

    it('n\'affiche pas le bouton "Supprimer le tableau" quand interactive=false, même si le tournoi n\'est pas FINISHED', () => {
      const fixture = setupAllPlacedFixture();
      const text: string = fixture.nativeElement.textContent;
      expect(text).not.toContain('Supprimer le tableau');
    });

    it('affiche le bouton "Imprimer le tableau" même quand interactive=false', () => {
      const fixture = setupAllPlacedFixture();
      const text: string = fixture.nativeElement.textContent;
      expect(text).toContain('Imprimer le tableau');
    });

    it('désactive tous les boutons de score (junctions) quand interactive=false, même si les 2 paires sont déterminées', () => {
      const fixture = setupAllPlacedFixture(); // tableau entièrement joué : hasBothPairs est vrai partout
      const junctionButtons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button.rounded-full');

      expect(junctionButtons.length).toBeGreaterThan(0);
      for (const button of Array.from(junctionButtons)) {
        expect(button.disabled).toBe(true);
      }
    });

    it('n\'estompe pas (opacity-40) les scores déjà saisis quand interactive=false : non cliquable mais lisible', () => {
      const fixture = setupAllPlacedFixture(); // tableau entièrement joué : un score existe sur chaque junction
      const junctionButtons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button.rounded-full');

      expect(junctionButtons.length).toBeGreaterThan(0);
      for (const button of Array.from(junctionButtons)) {
        expect(button.disabled).toBe(true);
        expect(button.classList.contains('opacity-40')).toBe(false);
        expect(button.textContent?.trim()).toContain('6-3 6-2');
      }
    });

    it('n\'affiche pas le panneau latéral "Liste des paires" quand interactive=false, même si toutes les paires ne sont pas placées', () => {
      const fixture = TestBed.createComponent(BracketChartComponent);
      // Tableau de dimension 8 non joué : pair1/pair2 à 0 partout sauf les feuilles -> paires non placées.
      const rootMatch = makeMatch({ round_display: 'Finale' });
      rootMatch.child1 = makeMatch({ round_display: 'Demi-finale' });
      rootMatch.child2 = makeMatch({ round_display: 'Demi-finale' });
      rootMatch.child1.child1 = makeMatch({ round_display: 'Quart de finale' });
      rootMatch.child1.child2 = makeMatch({ round_display: 'Quart de finale' });
      rootMatch.child2.child1 = makeMatch({ round_display: 'Quart de finale' });
      rootMatch.child2.child2 = makeMatch({ round_display: 'Quart de finale' });
      const bracket: BracketBase = { id: 12, dimension: 8, root_match: rootMatch };

      fixture.componentRef.setInput('bracket', bracket);
      fixture.componentRef.setInput('tournament', { status: TournamentStatus.STARTED });
      fixture.componentRef.setInput('pairs', buildPairs(8));
      fixture.componentRef.setInput('mode', 'placement');
      fixture.componentRef.setInput('interactive', false);
      fixture.detectChanges();

      const text: string = fixture.nativeElement.textContent;
      expect(text).not.toContain('Liste des paires');
      expect(fixture.nativeElement.querySelector('#pairs-panel-list')).toBeNull();
    });
  });

  describe('sélection de paire par clic sur un slot (modale)', () => {
    function setupUnplacedFixture() {
      const fixture = TestBed.createComponent(BracketChartComponent);
      // Tableau de dimension 8 non joué : pair1/pair2 à 0 partout sauf les feuilles -> paires non placées.
      const rootMatch = makeMatch({ round_display: 'Finale' });
      rootMatch.child1 = makeMatch({ round_display: 'Demi-finale' });
      rootMatch.child2 = makeMatch({ round_display: 'Demi-finale' });
      rootMatch.child1.child1 = makeMatch({ round_display: 'Quart de finale' });
      rootMatch.child1.child2 = makeMatch({ round_display: 'Quart de finale' });
      rootMatch.child2.child1 = makeMatch({ round_display: 'Quart de finale' });
      rootMatch.child2.child2 = makeMatch({ round_display: 'Quart de finale' });
      const bracket: BracketBase = { id: 20, dimension: 8, root_match: rootMatch };

      fixture.componentRef.setInput('bracket', bracket);
      fixture.componentRef.setInput('tournament', { status: TournamentStatus.STARTED });
      fixture.componentRef.setInput('pairs', buildPairs(8));
      fixture.componentRef.setInput('mode', 'placement');
      fixture.detectChanges();
      return fixture;
    }

    it('onSlotClick ouvre la modale (pairPickerSlot) sur un slot interactif libre', () => {
      const fixture = setupUnplacedFixture();
      const slot = fixture.componentInstance.layout().pairSlots
        .find(s => !s.isChampion && s.state === fixture.componentInstance.SlotState.Interactive)!;

      fixture.componentInstance.onSlotClick(slot);

      expect(fixture.componentInstance.pairPickerSlot()).toBe(slot);
      expect(fixture.componentInstance.pairPickerOptions()).not.toBeNull();
    });

    it('onSlotClick ne fait rien (no-op) si interactive=false', () => {
      const fixture = setupUnplacedFixture();
      fixture.componentRef.setInput('interactive', false);
      fixture.detectChanges();
      const slot = fixture.componentInstance.layout().pairSlots
        .find(s => !s.isChampion && s.state === fixture.componentInstance.SlotState.Interactive)!;

      fixture.componentInstance.onSlotClick(slot);

      expect(fixture.componentInstance.pairPickerSlot()).toBeNull();
    });

    it('onSlotClick ne fait rien (no-op) si le slot est déjà occupé', () => {
      const fixture = setupUnplacedFixture();
      const slot = fixture.componentInstance.layout().pairSlots
        .find(s => !s.isChampion && s.state === fixture.componentInstance.SlotState.Interactive)!;
      fixture.componentInstance.onSlotClick(slot);
      fixture.componentInstance.onPairPicked(1);
      expect(fixture.componentInstance.pairPickerSlot()).toBeNull();

      // Le même slot est désormais occupé : un nouveau clic ne doit pas rouvrir la modale.
      fixture.componentInstance.onSlotClick(slot);

      expect(fixture.componentInstance.pairPickerSlot()).toBeNull();
    });

    it('pairPickerOptions filtre les paires non placées par taille de tour d\'entrée (roundSize)', () => {
      const fixture = setupUnplacedFixture();
      const slot = fixture.componentInstance.layout().pairSlots
        .find(s => !s.isChampion && s.state === fixture.componentInstance.SlotState.Interactive)!;

      fixture.componentInstance.onSlotClick(slot);
      const options = fixture.componentInstance.pairPickerOptions();

      expect(options).not.toBeNull();
      expect(options!.length).toBeGreaterThan(0);
      for (const option of options!) {
        expect(fixture.componentInstance.unplacedPairs().some(p => p.id === option.id)).toBe(true);
      }
    });

    it('onPairPicked place la paire dans le slot ciblé et ferme la modale', () => {
      const fixture = setupUnplacedFixture();
      const slot = fixture.componentInstance.layout().pairSlots
        .find(s => !s.isChampion && s.state === fixture.componentInstance.SlotState.Interactive)!;
      fixture.componentInstance.onSlotClick(slot);
      const pairId = fixture.componentInstance.pairPickerOptions()![0].id;

      fixture.componentInstance.onPairPicked(pairId);

      expect(fixture.componentInstance.pairPickerSlot()).toBeNull();
      expect(fixture.componentInstance.seedingMap().get(slot.id)).toBe(pairId);
    });

    it('closePairPicker ferme la modale sans placer de paire', () => {
      const fixture = setupUnplacedFixture();
      const slot = fixture.componentInstance.layout().pairSlots
        .find(s => !s.isChampion && s.state === fixture.componentInstance.SlotState.Interactive)!;
      fixture.componentInstance.onSlotClick(slot);

      fixture.componentInstance.closePairPicker();

      expect(fixture.componentInstance.pairPickerSlot()).toBeNull();
      expect(fixture.componentInstance.seedingMap().get(slot.id)).toBeFalsy();
    });
  });

  it('mode score-only (classement) : ne génère aucune section d\'impression dédiée', () => {
    const fixture = TestBed.createComponent(BracketChartComponent);
    const rootMatch = buildPlayedTree(3);
    const bracket: BracketBase = { id: 2, dimension: 8, root_match: rootMatch };

    fixture.componentRef.setInput('bracket', bracket);
    fixture.componentRef.setInput('tournament', mockTournament);
    fixture.componentRef.setInput('pairs', buildPairs(8));
    fixture.componentRef.setInput('mode', 'score-only');
    fixture.detectChanges();

    expect(fixture.componentInstance.printSections().length).toBe(0);
    const printArea = fixture.nativeElement.querySelector('#printSectionsArea');
    expect(printArea).toBeFalsy();
  });

  it('dimension 8 (tient sur une page) : génère une seule section', () => {
    const fixture = TestBed.createComponent(BracketChartComponent);
    const rootMatch = buildPlayedTree(3);
    const bracket: BracketBase = { id: 3, dimension: 8, root_match: rootMatch };

    fixture.componentRef.setInput('bracket', bracket);
    fixture.componentRef.setInput('tournament', mockTournament);
    fixture.componentRef.setInput('pairs', buildPairs(8));
    fixture.componentRef.setInput('mode', 'placement');
    fixture.detectChanges();

    const printArea: HTMLElement = fixture.nativeElement.querySelector('#printSectionsArea');
    const sections = printArea.querySelectorAll(':scope > .break-inside-avoid');
    expect(sections.length).toBe(1);
  });

  describe('badges TS (têtes de série) quand aucun bye n\'existe (un seul palier = dimension)', () => {
    // weight décroissant par rapport à l'id : la paire avec l'id le plus élevé a le meilleur
    // classement (poids le plus faible), pour vérifier que le tri se fait bien par poids et non
    // par id/ordre du tableau.
    function buildPairsWithWeights(count: number): Pair[] {
      return buildPairs(count).map((p, i) => ({ ...p, weight: count - i }));
    }

    function setupFixture(bracket: BracketBase, pairs: Pair[]) {
      const fixture = TestBed.createComponent(BracketChartComponent);
      fixture.componentRef.setInput('bracket', bracket);
      fixture.componentRef.setInput('tournament', { status: TournamentStatus.STARTED });
      fixture.componentRef.setInput('pairs', pairs);
      fixture.componentRef.setInput('mode', 'placement');
      fixture.detectChanges();
      return fixture;
    }

    it('dimension 8, nb_pair_round_8=8, 8 paires : les 4 mieux classées (poids le plus faible) sont TS1-TS4, les 4 autres n\'ont pas de badge', () => {
      const rootMatch = buildPlayedTree(3);
      const bracket: BracketBase = { id: 100, dimension: 8, nb_pair_round_8: 8, root_match: rootMatch };
      const fixture = setupFixture(bracket, buildPairsWithWeights(8));

      // Poids = 8,7,6,5,4,3,2,1 pour les ids 1..8 -> triées par poids croissant : 8,7,6,5,4,3,2,1.
      const bestFour = [8, 7, 6, 5];
      const worstFour = [4, 3, 2, 1];

      for (const id of bestFour) {
        const badge = fixture.componentInstance.getSeedBadge(id);
        expect(badge).not.toBeNull();
        expect(badge!.rank).toBeGreaterThanOrEqual(1);
        expect(badge!.rank).toBeLessThanOrEqual(4);
      }
      for (const id of worstFour) {
        expect(fixture.componentInstance.getSeedBadge(id)).toBeNull();
      }
    });

    it('effectif impair (7 paires) : seules les 3 meilleures (floor(7/2)=3) sont badgées', () => {
      const rootMatch = buildPlayedTree(3);
      const bracket: BracketBase = { id: 101, dimension: 8, nb_pair_round_8: 7, root_match: rootMatch };
      const fixture = setupFixture(bracket, buildPairsWithWeights(7));

      // Poids = 7,6,5,4,3,2,1 pour les ids 1..7 -> triées par poids croissant : 7,6,5,4,3,2,1.
      const bestThree = [7, 6, 5];
      const rest = [4, 3, 2, 1];

      for (const id of bestThree) {
        expect(fixture.componentInstance.getSeedBadge(id)).not.toBeNull();
      }
      for (const id of rest) {
        expect(fixture.componentInstance.getSeedBadge(id)).toBeNull();
      }
    });

    it('non-régression : quand il existe un vrai palier de bye, le palier sans bye (roundSize = dimension) reste sans badge', () => {
      const rootMatch = buildPlayedTree(3);
      // 8 paires : les 4 premières (meilleur poids) forment le palier protégé (roundSize=4, avec bye),
      // les 4 dernières tombent dans le palier sans bye (roundSize=8=dimension) et ne doivent pas être badgées.
      const bracket: BracketBase = { id: 102, dimension: 8, nb_pair_round_4: 4, root_match: rootMatch };
      const fixture = setupFixture(bracket, buildPairsWithWeights(8));

      const byeTierIds = [8, 7, 6, 5]; // meilleur poids -> palier roundSize=4
      const noByeTierIds = [4, 3, 2, 1]; // palier roundSize=8=dimension

      for (const id of byeTierIds) {
        expect(fixture.componentInstance.getSeedBadge(id)).not.toBeNull();
      }
      for (const id of noByeTierIds) {
        expect(fixture.componentInstance.getSeedBadge(id)).toBeNull();
      }
    });

    it('les paires badgées dans le cas sans bye reçoivent la sévérité "warn"', () => {
      const rootMatch = buildPlayedTree(3);
      const bracket: BracketBase = { id: 103, dimension: 8, nb_pair_round_8: 8, root_match: rootMatch };
      const fixture = setupFixture(bracket, buildPairsWithWeights(8));

      const bestFour = [8, 7, 6, 5];
      for (const id of bestFour) {
        const badge = fixture.componentInstance.getSeedBadge(id);
        expect(badge).not.toBeNull();
        expect(badge!.severity).toBe('warn');
      }
    });
  });
});
