import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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

  it('reorderEnabled() est vrai quand le tournoi est STARTED', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance.reorderEnabled()).toBeTrue();
  });

  it('reorderEnabled() est faux quand le tournoi est FINISHED', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('tournament', { ...mockTournament, status: TournamentStatus.FINISHED });
    fixture.detectChanges();

    expect(fixture.componentInstance.reorderEnabled()).toBeFalse();
  });

  it('seul le app-match-list de l’onglet "upcoming" reçoit reorderable() à vrai quand le tournoi est STARTED', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    // p-tabpanel ne rend son contenu que pour l'onglet actif (cf. TabPanel : `@if (active())`).
    // On active successivement chaque onglet pour inspecter chaque app-match-list monté.
    const tabButtons = fixture.debugElement.queryAll(By.css('p-tab'));
    const reorderableByTab = new Map<string, boolean[]>();

    for (const tabButton of tabButtons) {
      tabButton.nativeElement.click();
      fixture.detectChanges();

      const label = (tabButton.nativeElement.textContent ?? '').trim();
      const matchListInstances = fixture.debugElement
        .queryAll(By.directive(MatchListComponent))
        .map(el => el.componentInstance as MatchListComponent);
      reorderableByTab.set(label, matchListInstances.map(instance => instance.reorderable()));
    }

    expect(reorderableByTab.get('À venir')).toEqual([true]);
    expect(reorderableByTab.get('En cours')).toEqual([false]);
    expect(reorderableByTab.get('Terminés')).toEqual([false]);
  });
});
