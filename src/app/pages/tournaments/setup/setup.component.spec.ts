import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { SetupComponent } from './setup.component';
import { TournamentService } from '../../../shared/services/tournament.service';
import { PairService } from '../../../shared/services/pair.service';
import { Tournament, TournamentStatus } from '../../../shared/models/tournament.models';

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
  pairs_count: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('SetupComponent', () => {
  beforeEach(() => {
    // app-brackets et app-matchs sont instanciés inconditionnellement dans le template de
    // SetupComponent (le *ngIf="tournamentContainsBracket" ne porte que sur les p-tab, pas sur
    // les p-tabpanel correspondants) : leurs effects initiaux appellent getTournamentBracket et
    // getMatches dès le premier detectChanges, même si ces tabs sont masqués.
    const tournamentServiceSpy = jasmine.createSpyObj('TournamentService', [
      'getTournament',
      'getGenders',
      'getCategories',
      'getLeagues',
      'getGameFormats',
      'getConfigurations',
      'getGameFormatDurations',
      'getInformations',
      'getTournamentBracket',
      'getMatches',
    ]);
    tournamentServiceSpy.getTournament.and.returnValue(of(mockTournament));
    tournamentServiceSpy.getGenders.and.returnValue(of([]));
    tournamentServiceSpy.getCategories.and.returnValue(of([]));
    tournamentServiceSpy.getLeagues.and.returnValue(of([]));
    tournamentServiceSpy.getGameFormats.and.returnValue(of([]));
    tournamentServiceSpy.getConfigurations.and.returnValue(of([]));
    tournamentServiceSpy.getGameFormatDurations.and.returnValue(of([]));
    tournamentServiceSpy.getInformations.and.returnValue(of({ last_league: '', last_location: '', all_locations: [] }));
    tournamentServiceSpy.getTournamentBracket.and.returnValue(of(null));
    tournamentServiceSpy.getMatches.and.returnValue(of([]));

    const pairServiceSpy = jasmine.createSpyObj('PairService', ['getPairs']);
    pairServiceSpy.getPairs.and.returnValue(of([]));

    const activatedRouteStub = {
      snapshot: { paramMap: { get: () => '1' } },
    };

    const confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);

    TestBed.configureTestingModule({
      imports: [SetupComponent],
      providers: [
        provideHttpClient(),
        { provide: TournamentService, useValue: tournamentServiceSpy },
        { provide: PairService, useValue: pairServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
      ],
    });
  });

  it('bumpMatchesUpdateTick incrémente matchesUpdateTick', () => {
    const fixture = TestBed.createComponent(SetupComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.matchesUpdateTick()).toBe(0);

    component.bumpMatchesUpdateTick();
    expect(component.matchesUpdateTick()).toBe(1);

    component.bumpMatchesUpdateTick();
    expect(component.matchesUpdateTick()).toBe(2);
  });
});
