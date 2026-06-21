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
});
