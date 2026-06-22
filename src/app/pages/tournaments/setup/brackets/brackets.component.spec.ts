import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { BracketsComponent } from './brackets.component';
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

describe('BracketsComponent', () => {
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;
  let confirmationServiceSpy: jasmine.SpyObj<ConfirmationService>;
  let confirmAccept: (() => void) | undefined;

  beforeEach(() => {
    tournamentServiceSpy = jasmine.createSpyObj('TournamentService', [
      'getTournamentBracket',
      'updateMatchScore',
      'updateBracketPlacement',
      'deleteMatchScore',
      'deleteTournamentBracket',
    ]);
    tournamentServiceSpy.getTournamentBracket.and.returnValue(of(makeBracket()));

    confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    confirmationServiceSpy.confirm.and.callFake((confirmation: { accept?: () => void }) => {
      confirmAccept = confirmation.accept;
      return confirmationServiceSpy;
    });

    TestBed.configureTestingModule({
      imports: [BracketsComponent],
      providers: [
        { provide: TournamentService, useValue: tournamentServiceSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
      ],
    });
  });

  function createFixture() {
    const fixture = TestBed.createComponent(BracketsComponent);
    fixture.componentRef.setInput('tournament', mockTournament);
    fixture.componentRef.setInput('pairs', []);
    fixture.componentRef.setInput('availableGameFormats', []);
    return fixture;
  }

  it('charge le bracket à la création du composant', () => {
    const fixture = createFixture();
    fixture.detectChanges();
    expect(tournamentServiceSpy.getTournamentBracket).toHaveBeenCalledTimes(1);
    expect(tournamentServiceSpy.getTournamentBracket).toHaveBeenCalledWith(mockTournament.id);
  });

  it('un changement de refreshTrigger recharge le bracket sans émettre matchesChanged', () => {
    const fixture = createFixture();
    fixture.detectChanges();
    expect(tournamentServiceSpy.getTournamentBracket).toHaveBeenCalledTimes(1);

    const matchesChangedSpy = spyOn(fixture.componentInstance.matchesChanged, 'emit');

    fixture.componentRef.setInput('refreshTrigger', 1);
    fixture.detectChanges();

    expect(tournamentServiceSpy.getTournamentBracket).toHaveBeenCalledTimes(2);
    expect(matchesChangedSpy).not.toHaveBeenCalled();
  });

  it('onScoreChanged émet matchesChanged une fois après succès', () => {
    tournamentServiceSpy.updateMatchScore.and.returnValue(of(makeBracketMatch()) as any);
    const fixture = createFixture();
    fixture.detectChanges();

    const matchesChangedSpy = spyOn(fixture.componentInstance.matchesChanged, 'emit');
    fixture.componentInstance.onScoreChanged({ matchId: 1, score: '6-2 6-3', winnerId: 1 });

    expect(matchesChangedSpy).toHaveBeenCalledTimes(1);
  });

  it('onSeedingChanged émet matchesChanged une fois après succès', () => {
    tournamentServiceSpy.updateBracketPlacement.and.returnValue(of(makeBracket()));
    const fixture = createFixture();
    fixture.detectChanges();

    const matchesChangedSpy = spyOn(fixture.componentInstance.matchesChanged, 'emit');
    fixture.componentInstance.onSeedingChanged({ placements: [] });

    expect(matchesChangedSpy).toHaveBeenCalledTimes(1);
  });

  it('onScoreDeleteRequested émet matchesChanged une fois après confirmation et succès', () => {
    tournamentServiceSpy.deleteMatchScore.and.returnValue(of(undefined));
    const fixture = createFixture();
    fixture.detectChanges();

    const matchesChangedSpy = spyOn(fixture.componentInstance.matchesChanged, 'emit');
    fixture.componentInstance.onScoreDeleteRequested(1);

    expect(confirmationServiceSpy.confirm).toHaveBeenCalledTimes(1);
    confirmAccept?.();

    expect(tournamentServiceSpy.deleteMatchScore).toHaveBeenCalledWith(mockTournament.id, 1);
    expect(matchesChangedSpy).toHaveBeenCalledTimes(1);
  });

  it('bracketHasBeenGenerated émet matchesChanged une fois', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    const matchesChangedSpy = spyOn(fixture.componentInstance.matchesChanged, 'emit');
    fixture.componentInstance.bracketHasBeenGenerated(makeBracket());

    expect(matchesChangedSpy).toHaveBeenCalledTimes(1);
  });

  it('onDeleteBracketRequested émet matchesChanged une fois après confirmation et succès', () => {
    tournamentServiceSpy.deleteTournamentBracket.and.returnValue(of(undefined));
    const fixture = createFixture();
    fixture.detectChanges();

    const matchesChangedSpy = spyOn(fixture.componentInstance.matchesChanged, 'emit');
    fixture.componentInstance.onDeleteBracketRequested();

    expect(confirmationServiceSpy.confirm).toHaveBeenCalledTimes(1);
    confirmAccept?.();

    expect(tournamentServiceSpy.deleteTournamentBracket).toHaveBeenCalledWith(mockTournament.id);
    expect(matchesChangedSpy).toHaveBeenCalledTimes(1);
  });
});
