import { TestBed } from '@angular/core/testing';
import { MatchCardComponent } from './match-card.component';
import { Match, MatchStatus } from '../../../../../shared/models/tournament.models';
import { Pair, Player } from '../../../../../shared/models/pair.models';

function makePlayer(id: number, lastName: string): Player {
  return { id, last_name: lastName, first_name: 'Prenom', license_number: `LIC${id}`, ranking: null };
}

function makePair(id: number): Pair {
  return {
    id,
    player1: makePlayer(id * 2, `Nom${id}A`),
    player2: makePlayer(id * 2 + 1, `Nom${id}B`),
    weight: null,
  };
}

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    round: 'R',
    round_display: 'Round',
    match_number: 1,
    order: 1,
    pair1: 1,
    pair2: 2,
    game_format: 'C1',
    score: '',
    winner_id: 0,
    status: MatchStatus.UPCOMING,
    finished_at: '',
    started_at: null,
    estimated_start_at: null,
    ...overrides,
  };
}

describe('MatchCardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatchCardComponent],
    });
  });

  function createFixture(match: Match) {
    const fixture = TestBed.createComponent(MatchCardComponent);
    fixture.componentRef.setInput('match', match);
    fixture.componentRef.setInput('pair1', makePair(1));
    fixture.componentRef.setInput('pair2', makePair(2));
    fixture.detectChanges();
    return fixture;
  }

  describe('startedAtLabel', () => {
    it('retourne null si le statut n\'est pas STARTED', () => {
      const fixture = createFixture(makeMatch({ status: MatchStatus.UPCOMING, started_at: '2026-06-22T10:00:00Z' }));
      expect(fixture.componentInstance.startedAtLabel).toBeNull();
    });

    it('retourne null si started_at est null, même si le statut est STARTED', () => {
      const fixture = createFixture(makeMatch({ status: MatchStatus.STARTED, started_at: null }));
      expect(fixture.componentInstance.startedAtLabel).toBeNull();
    });

    it('retourne l\'heure formatée si le statut est STARTED et started_at renseigné', () => {
      const fixture = createFixture(makeMatch({ status: MatchStatus.STARTED, started_at: '2026-06-22T10:05:00' }));
      expect(fixture.componentInstance.startedAtLabel).toBe('10h05');
    });
  });

  describe('rendu du bloc FINISHED', () => {
    it('affiche la date ET l\'heure de fin dans le DOM', () => {
      const fixture = createFixture(makeMatch({
        status: MatchStatus.FINISHED,
        finished_at: '2026-06-22T14h30'.replace('h', ':'),
        winner_id: 1,
      }));
      const text: string = fixture.nativeElement.textContent;
      expect(text).toContain('22/06/2026');
      expect(text).toContain('14h30');
      expect(text).toContain('à');
    });
  });

  describe('rendu du bloc STARTED', () => {
    it('affiche "Débuté à" suivi de l\'heure quand le match est en cours', () => {
      const fixture = createFixture(makeMatch({ status: MatchStatus.STARTED, started_at: '2026-06-22T09:15:00' }));
      const text: string = fixture.nativeElement.textContent;
      expect(text).toContain('Débuté à 09h15');
    });

    it('n\'affiche pas le bloc "Débuté à" si started_at est null', () => {
      const fixture = createFixture(makeMatch({ status: MatchStatus.STARTED, started_at: null }));
      const text: string = fixture.nativeElement.textContent;
      expect(text).not.toContain('Débuté à');
    });
  });
});
