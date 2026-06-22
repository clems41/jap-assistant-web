import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatchsComponent } from './matchs.component';
import { TournamentService } from '../../../../shared/services/tournament.service';
import { Tournament, TournamentStatus } from '../../../../shared/models/tournament.models';
import { MatchListComponent } from './match-list/match-list.component';

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

describe('MatchsComponent', () => {
  let tournamentServiceSpy: jasmine.SpyObj<TournamentService>;

  beforeEach(() => {
    tournamentServiceSpy = jasmine.createSpyObj('TournamentService', ['getMatches']);
    tournamentServiceSpy.getMatches.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [MatchsComponent],
      providers: [
        { provide: TournamentService, useValue: tournamentServiceSpy },
      ],
    });
  });

  function createFixture() {
    const fixture = TestBed.createComponent(MatchsComponent);
    fixture.componentRef.setInput('tournament', mockTournament);
    fixture.componentRef.setInput('pairs', []);
    return fixture;
  }

  it('onRefreshNeeded émet matchesChanged', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    const matchesChangedSpy = spyOn(fixture.componentInstance.matchesChanged, 'emit');
    fixture.componentInstance.onRefreshNeeded();

    expect(matchesChangedSpy).toHaveBeenCalledTimes(1);
  });

  it('un changement de refreshTrigger se propage à tous les app-match-list montés', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('refreshTrigger', 0);
    fixture.detectChanges();

    const matchListInstances = fixture.debugElement
      .queryAll(sel => sel.componentInstance instanceof MatchListComponent)
      .map(el => el.componentInstance as MatchListComponent);
    expect(matchListInstances.length).toBeGreaterThan(0);
    for (const instance of matchListInstances) {
      expect(instance.refreshTrigger()).toBe(0);
    }

    fixture.componentRef.setInput('refreshTrigger', 5);
    fixture.detectChanges();

    for (const instance of matchListInstances) {
      expect(instance.refreshTrigger()).toBe(5);
    }
  });
});
