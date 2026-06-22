import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ClassificationBracketsComponent } from './classification-brackets.component';
import { TournamentService } from '../../../../shared/services/tournament.service';
import { Bracket, BracketMatch, MatchStatus, Tournament, TournamentStatus } from '../../../../shared/models/tournament.models';

function makeBracketMatch(overrides: Partial<BracketMatch> = {}): BracketMatch {
  return {
    id: 1,
    round: 'R',
    round_display: 'Round',
    match_number: 1,
    pair1: 1,
    pair2: 2,
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

function makeBracket(overrides: Partial<Bracket> = {}): Bracket {
  return {
    id: 1,
    dimension: 8,
    nb_pair_round_64: 0,
    nb_pair_round_32: 0,
    nb_pair_round_16: 0,
    nb_pair_round_8: 8,
    nb_pair_round_4: 0,
    root_match: makeBracketMatch(),
    classification_brackets: [],
    ...overrides,
  };
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
  pairs_count: 8,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('ClassificationBracketsComponent', () => {
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;
  let confirmationServiceSpy: jasmine.SpyObj<ConfirmationService>;
  let confirmAccept: (() => void) | undefined;

  beforeEach(() => {
    tournamentServiceSpy = jasmine.createSpyObj('TournamentService', [
      'getTournamentBracket',
      'updateMatchScore',
      'deleteMatchScore',
    ]);

    confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    confirmationServiceSpy.confirm.and.callFake((confirmation: { accept?: () => void }) => {
      confirmAccept = confirmation.accept;
      return confirmationServiceSpy;
    });

    TestBed.configureTestingModule({
      imports: [ClassificationBracketsComponent],
      providers: [
        { provide: TournamentService, useValue: tournamentServiceSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
      ],
    });
  });

  function createFixture() {
    const fixture = TestBed.createComponent(ClassificationBracketsComponent);
    fixture.componentRef.setInput('tournament', mockTournament);
    fixture.componentRef.setInput('pairs', []);
    fixture.componentRef.setInput('bracket', makeBracket());
    fixture.detectChanges();
    return fixture;
  }

  it('onScoreChanged émet bracketChange et matchesChanged après succès', () => {
    tournamentServiceSpy.updateMatchScore.and.returnValue(of(makeBracketMatch()) as any);
    const refreshedBracket = makeBracket({ id: 2 });
    tournamentServiceSpy.getTournamentBracket.and.returnValue(of(refreshedBracket));

    const fixture = createFixture();
    const bracketChangeSpy = spyOn(fixture.componentInstance.bracketChange, 'emit');
    const matchesChangedSpy = spyOn(fixture.componentInstance.matchesChanged, 'emit');

    fixture.componentInstance.onScoreChanged({ matchId: 1, score: '6-2 6-3', winnerId: 1 });

    expect(bracketChangeSpy).toHaveBeenCalledOnceWith(refreshedBracket);
    expect(matchesChangedSpy).toHaveBeenCalledTimes(1);
  });

  it('onScoreDeleteRequested émet bracketChange et matchesChanged après confirmation et succès', () => {
    tournamentServiceSpy.deleteMatchScore.and.returnValue(of(undefined));
    const refreshedBracket = makeBracket({ id: 3 });
    tournamentServiceSpy.getTournamentBracket.and.returnValue(of(refreshedBracket));

    const fixture = createFixture();
    const bracketChangeSpy = spyOn(fixture.componentInstance.bracketChange, 'emit');
    const matchesChangedSpy = spyOn(fixture.componentInstance.matchesChanged, 'emit');

    fixture.componentInstance.onScoreDeleteRequested(1);

    expect(confirmationServiceSpy.confirm).toHaveBeenCalledTimes(1);
    confirmAccept?.();

    expect(tournamentServiceSpy.deleteMatchScore).toHaveBeenCalledWith(mockTournament.id, 1);
    expect(bracketChangeSpy).toHaveBeenCalledOnceWith(refreshedBracket);
    expect(matchesChangedSpy).toHaveBeenCalledTimes(1);
  });
});
