import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PublicTournamentPageComponent } from './public-tournament.page';
import { PublicTournamentService } from '../../shared/services/public-tournament.service';
import { PublicTournamentUpdatesService } from '../../shared/services/public-tournament-updates.service';
import { MatchStatus, TournamentStatus } from '../../shared/models/tournament.models';
import { PublicBracketMatch, PublicBracketResponse, PublicTournament } from '../../shared/models/public-tournament.models';

const mockTournament: PublicTournament = {
  public_code: 'ABC123',
  name: 'Tournoi Test',
  category: 'P100',
  start_date: '2026-04-15',
  location: 'Lyon',
  league: 'Auvergne-Rhône-Alpes',
  gender: 'Homme',
  game_format: 'C1',
  configuration: 'POULES',
  estimated_match_duration: 60,
  status: TournamentStatus.STARTED,
  pairs_count: 8,
};

const mockBracketMatch: PublicBracketMatch = {
  round: 'F',
  round_display: 'Finale',
  match_number: 1,
  pair1: null,
  pair2: null,
  winner: null,
  game_format: 'C1',
  score: '',
  status: MatchStatus.UPCOMING,
  status_display: 'À venir',
  started_at: null,
  finished_at: null,
  disabled: false,
  child1: null,
  child2: null,
};

function mockBracketResponse(withClassification: boolean): PublicBracketResponse {
  return {
    root_match: mockBracketMatch,
    classification_brackets: withClassification
      ? [
          {
            source_round_display: 'Demi-finale',
            start_place: 3,
            end_place: 4,
            root_match: mockBracketMatch,
            children: [],
          },
        ]
      : [],
  };
}

describe('PublicTournamentPageComponent', () => {
  let publicTournamentServiceSpy: jasmine.SpyObj<PublicTournamentService>;
  let updatesServiceSpy: jasmine.SpyObj<PublicTournamentUpdatesService>;
  let tournamentResourceSubject: Subject<void>;
  let bracketResourceSubject: Subject<void>;
  let reconnectedSubject: Subject<void>;

  function configureTestBed(routeStub: {
    snapshot: { paramMap: { get: (key: string) => string | null }; queryParamMap: { get: (key: string) => string | null } };
  }): void {
    publicTournamentServiceSpy = jasmine.createSpyObj('PublicTournamentService', [
      'getPublicTournament',
      'getPublicMatches',
      'getPublicBracket',
      'getPublicPairs',
    ]);
    publicTournamentServiceSpy.getPublicMatches.and.returnValue(of([]));
    publicTournamentServiceSpy.getPublicPairs.and.returnValue(of([]));

    updatesServiceSpy = jasmine.createSpyObj('PublicTournamentUpdatesService', [
      'connect',
      'disconnect',
      'onResource',
    ]);
    tournamentResourceSubject = new Subject<void>();
    bracketResourceSubject = new Subject<void>();
    updatesServiceSpy.onResource.and.callFake(resource =>
      resource === 'tournament' ? tournamentResourceSubject : bracketResourceSubject,
    );
    reconnectedSubject = new Subject<void>();
    (updatesServiceSpy as unknown as { reconnected$: Subject<void> }).reconnected$ = reconnectedSubject;

    TestBed.configureTestingModule({
      imports: [PublicTournamentPageComponent],
      providers: [
        provideHttpClient(),
        MessageService,
        { provide: PublicTournamentService, useValue: publicTournamentServiceSpy },
        { provide: PublicTournamentUpdatesService, useValue: updatesServiceSpy },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    });
  }

  function routeStubWithCode(code: string | null): {
    snapshot: { paramMap: { get: (key: string) => string | null }; queryParamMap: { get: (key: string) => string | null } };
  } {
    return {
      snapshot: {
        paramMap: { get: () => code },
        queryParamMap: { get: () => code },
      },
    };
  }

  it("code absent (ni path param ni query param) : notFound() est true et aucun appel HTTP n'est fait", () => {
    configureTestBed(routeStubWithCode(null));

    const fixture = TestBed.createComponent(PublicTournamentPageComponent);
    const component = fixture.componentInstance;

    expect(component.notFound()).toBe(true);
    expect(publicTournamentServiceSpy.getPublicTournament).not.toHaveBeenCalled();
    expect(publicTournamentServiceSpy.getPublicBracket).not.toHaveBeenCalled();
  });

  it('code présent + succès détail tournoi + succès bracket : tournament() rempli, loading() false, notFound() false', () => {
    configureTestBed(routeStubWithCode('ABC123'));
    publicTournamentServiceSpy.getPublicTournament.and.returnValue(of(mockTournament));
    publicTournamentServiceSpy.getPublicBracket.and.returnValue(of(mockBracketResponse(false)));

    const fixture = TestBed.createComponent(PublicTournamentPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.notFound()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.tournament()).toEqual(mockTournament);
  });

  it("code présent + erreur (404) sur getPublicTournament : notFound() devient true", () => {
    configureTestBed(routeStubWithCode('UNKNOWN'));
    publicTournamentServiceSpy.getPublicTournament.and.returnValue(throwError(() => new Error('404')));
    publicTournamentServiceSpy.getPublicBracket.and.returnValue(of(mockBracketResponse(false)));

    const fixture = TestBed.createComponent(PublicTournamentPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.notFound()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('détail tournoi OK mais getPublicBracket en erreur : notFound() reste false, bracketNotGenerated() devient true, bracketResult() reste null', () => {
    configureTestBed(routeStubWithCode('ABC123'));
    publicTournamentServiceSpy.getPublicTournament.and.returnValue(of(mockTournament));
    publicTournamentServiceSpy.getPublicBracket.and.returnValue(throwError(() => new Error('404')));

    const fixture = TestBed.createComponent(PublicTournamentPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.notFound()).toBe(false);
    expect(component.bracketNotGenerated()).toBe(true);
    expect(component.bracketResult()).toBeNull();
  });

  it('hasClassification() reflète la présence de classification_brackets non vide dans le bracket mappé', () => {
    // Pas de detectChanges() ici : la construction de PublicTournamentPageComponent déclenche déjà
    // les subscribe() synchrones (via of(...)) qui alimentent bracketResult()/hasClassification().
    // Un detectChanges() forcerait le rendu réel de app-classification-brackets, qui injecte
    // TournamentService -> HttpRequesterService -> ENVIRONMENT (non mocké ici, hors périmètre de
    // cette page) dès que l'onglet "classification" existe dans le DOM.
    configureTestBed(routeStubWithCode('ABC123'));
    publicTournamentServiceSpy.getPublicTournament.and.returnValue(of(mockTournament));
    publicTournamentServiceSpy.getPublicBracket.and.returnValue(of(mockBracketResponse(false)));

    const fixtureWithout = TestBed.createComponent(PublicTournamentPageComponent);
    expect(fixtureWithout.componentInstance.hasClassification()).toBe(false);

    TestBed.resetTestingModule();
    configureTestBed(routeStubWithCode('ABC123'));
    publicTournamentServiceSpy.getPublicTournament.and.returnValue(of(mockTournament));
    publicTournamentServiceSpy.getPublicBracket.and.returnValue(of(mockBracketResponse(true)));

    const fixtureWith = TestBed.createComponent(PublicTournamentPageComponent);
    expect(fixtureWith.componentInstance.hasClassification()).toBe(true);
  });

  it('code présent : se connecte au WebSocket avec le code du tournoi', () => {
    configureTestBed(routeStubWithCode('ABC123'));
    publicTournamentServiceSpy.getPublicTournament.and.returnValue(of(mockTournament));
    publicTournamentServiceSpy.getPublicBracket.and.returnValue(of(mockBracketResponse(false)));

    TestBed.createComponent(PublicTournamentPageComponent);

    expect(updatesServiceSpy.connect).toHaveBeenCalledWith('ABC123');
  });

  it('destruction du composant : se déconnecte du WebSocket', () => {
    configureTestBed(routeStubWithCode('ABC123'));
    publicTournamentServiceSpy.getPublicTournament.and.returnValue(of(mockTournament));
    publicTournamentServiceSpy.getPublicBracket.and.returnValue(of(mockBracketResponse(false)));

    const fixture = TestBed.createComponent(PublicTournamentPageComponent);
    fixture.destroy();

    expect(updatesServiceSpy.disconnect).toHaveBeenCalled();
  });

  it("notification sur la ressource 'tournament' : refetch du tournoi (nouveau getPublicTournament)", () => {
    configureTestBed(routeStubWithCode('ABC123'));
    publicTournamentServiceSpy.getPublicTournament.and.returnValue(of(mockTournament));
    publicTournamentServiceSpy.getPublicBracket.and.returnValue(of(mockBracketResponse(false)));

    TestBed.createComponent(PublicTournamentPageComponent);
    expect(publicTournamentServiceSpy.getPublicTournament).toHaveBeenCalledTimes(1);

    tournamentResourceSubject.next();

    expect(publicTournamentServiceSpy.getPublicTournament).toHaveBeenCalledTimes(2);
    expect(publicTournamentServiceSpy.getPublicBracket).toHaveBeenCalledTimes(1);
  });

  it("notification sur la ressource 'bracket' : refetch du bracket (nouveau getPublicBracket)", () => {
    configureTestBed(routeStubWithCode('ABC123'));
    publicTournamentServiceSpy.getPublicTournament.and.returnValue(of(mockTournament));
    publicTournamentServiceSpy.getPublicBracket.and.returnValue(of(mockBracketResponse(false)));

    TestBed.createComponent(PublicTournamentPageComponent);
    expect(publicTournamentServiceSpy.getPublicBracket).toHaveBeenCalledTimes(1);

    bracketResourceSubject.next();

    expect(publicTournamentServiceSpy.getPublicBracket).toHaveBeenCalledTimes(2);
    expect(publicTournamentServiceSpy.getPublicTournament).toHaveBeenCalledTimes(1);
  });

  it('reconnexion (reconnected$) : refetch à la fois du tournoi et du bracket', () => {
    configureTestBed(routeStubWithCode('ABC123'));
    publicTournamentServiceSpy.getPublicTournament.and.returnValue(of(mockTournament));
    publicTournamentServiceSpy.getPublicBracket.and.returnValue(of(mockBracketResponse(false)));

    TestBed.createComponent(PublicTournamentPageComponent);
    expect(publicTournamentServiceSpy.getPublicTournament).toHaveBeenCalledTimes(1);
    expect(publicTournamentServiceSpy.getPublicBracket).toHaveBeenCalledTimes(1);

    reconnectedSubject.next();

    expect(publicTournamentServiceSpy.getPublicTournament).toHaveBeenCalledTimes(2);
    expect(publicTournamentServiceSpy.getPublicBracket).toHaveBeenCalledTimes(2);
  });
});
