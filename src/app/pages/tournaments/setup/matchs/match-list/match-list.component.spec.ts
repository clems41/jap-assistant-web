import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatchListComponent } from './match-list.component';
import { TournamentService } from '../../../../../shared/services/tournament.service';
import { Match, MatchStatus, Tournament, TournamentStatus } from '../../../../../shared/models/tournament.models';

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

describe('MatchListComponent', () => {
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;

  beforeEach(() => {
    tournamentServiceSpy = jasmine.createSpyObj('TournamentService', [
      'getMatches',
      'startMatch',
      'updateMatchScore',
      'updateMatchesOrder',
    ]);
    tournamentServiceSpy.getMatches.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [MatchListComponent],
      providers: [
        { provide: TournamentService, useValue: tournamentServiceSpy },
      ],
    });
  });

  function createFixture() {
    const fixture = TestBed.createComponent(MatchListComponent);
    fixture.componentRef.setInput('tournament', mockTournament);
    fixture.componentRef.setInput('pairs', []);
    fixture.componentRef.setInput('statuses', [MatchStatus.UPCOMING]);
    return fixture;
  }

  it('charge les matchs au montage (effect initial)', () => {
    const fixture = createFixture();
    fixture.detectChanges();
    expect(tournamentServiceSpy.getMatches).toHaveBeenCalledTimes(1);
    expect(tournamentServiceSpy.getMatches).toHaveBeenCalledWith(mockTournament.id, [MatchStatus.UPCOMING]);
  });

  it('recharge les matchs quand refreshTrigger change', () => {
    const firstBatch = [makeMatch({ id: 1 })];
    const secondBatch = [makeMatch({ id: 2 }), makeMatch({ id: 3 })];
    tournamentServiceSpy.getMatches.and.returnValues(of(firstBatch), of(secondBatch));

    const fixture = createFixture();
    fixture.componentRef.setInput('refreshTrigger', 0);
    fixture.detectChanges();

    expect(fixture.componentInstance.matches()).toEqual(firstBatch);
    expect(tournamentServiceSpy.getMatches).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('refreshTrigger', 1);
    fixture.detectChanges();

    expect(tournamentServiceSpy.getMatches).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.matches()).toEqual(secondBatch);
  });

  it('émet refreshNeeded après un démarrage de match réussi (onStartRequested)', () => {
    tournamentServiceSpy.startMatch.and.returnValue(of(makeMatch({ id: 1, status: MatchStatus.STARTED })) as any);
    const fixture = createFixture();
    fixture.detectChanges();

    const emitSpy = spyOn(fixture.componentInstance.refreshNeeded, 'emit');
    fixture.componentInstance.onStartRequested(1);

    expect(tournamentServiceSpy.startMatch).toHaveBeenCalledWith(mockTournament.id, 1);
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('émet refreshNeeded après une sauvegarde de score réussie (onScoreSaved)', () => {
    tournamentServiceSpy.updateMatchScore.and.returnValue(of(makeMatch({ id: 1, status: MatchStatus.FINISHED })) as any);
    const fixture = createFixture();
    fixture.detectChanges();

    const emitSpy = spyOn(fixture.componentInstance.refreshNeeded, 'emit');
    fixture.componentInstance.onScoreSaved({ matchId: 1, score: '6-2 6-3', winnerId: 1 });

    expect(tournamentServiceSpy.updateMatchScore).toHaveBeenCalledWith(mockTournament.id, 1, {
      score: '6-2 6-3',
      winner_id: 1,
    });
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('trie les matchs par order croissant quand sortByFinishedAtDesc est faux', () => {
    const unsortedBatch = [makeMatch({ id: 1, order: 3 }), makeMatch({ id: 2, order: 1 })];
    tournamentServiceSpy.getMatches.and.returnValue(of(unsortedBatch));

    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance.matches().map(m => m.id)).toEqual([2, 1]);
  });

  describe('onDrop', () => {
    function buildEvent(previousIndex: number, currentIndex: number): CdkDragDrop<Match[]> {
      return { previousIndex, currentIndex } as CdkDragDrop<Match[]>;
    }

    it('met à jour optimistiquement matches() puis applique le résultat serveur', () => {
      const initialBatch = [makeMatch({ id: 1, order: 1 }), makeMatch({ id: 2, order: 2 }), makeMatch({ id: 3, order: 3 })];
      tournamentServiceSpy.getMatches.and.returnValue(of(initialBatch));
      const serverResult = [makeMatch({ id: 2, order: 1 }), makeMatch({ id: 1, order: 2 }), makeMatch({ id: 3, order: 3 })];
      tournamentServiceSpy.updateMatchesOrder.and.returnValue(of(serverResult));

      const fixture = createFixture();
      fixture.detectChanges();

      fixture.componentInstance.onDrop(buildEvent(0, 1));

      expect(tournamentServiceSpy.updateMatchesOrder).toHaveBeenCalledWith(mockTournament.id, {
        match_ids: [2, 1, 3],
      });
      expect(fixture.componentInstance.matches()).toEqual(serverResult);
    });

    it('revient à l’état précédent si la requête échoue (rollback)', () => {
      const initialBatch = [makeMatch({ id: 1, order: 1 }), makeMatch({ id: 2, order: 2 }), makeMatch({ id: 3, order: 3 })];
      tournamentServiceSpy.getMatches.and.returnValue(of(initialBatch));
      tournamentServiceSpy.updateMatchesOrder.and.returnValue(throwError(() => new Error('409')));

      const fixture = createFixture();
      fixture.detectChanges();

      fixture.componentInstance.onDrop(buildEvent(0, 1));

      expect(fixture.componentInstance.matches()).toEqual(initialBatch);
    });

    it('ne fait rien si previousIndex === currentIndex', () => {
      const initialBatch = [makeMatch({ id: 1, order: 1 }), makeMatch({ id: 2, order: 2 })];
      tournamentServiceSpy.getMatches.and.returnValue(of(initialBatch));

      const fixture = createFixture();
      fixture.detectChanges();

      fixture.componentInstance.onDrop(buildEvent(1, 1));

      expect(tournamentServiceSpy.updateMatchesOrder).not.toHaveBeenCalled();
    });
  });
});
