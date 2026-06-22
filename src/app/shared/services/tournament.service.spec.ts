import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpRequesterService } from './http-requester.service';
import {BracketMatch, Match, MatchStatus, ReorderMatchesRequest, ScoreRequest, Tournament, TournamentRequest, TournamentStatus} from '../models/tournament.models';
import {EnumChoice, PaginatedResponse} from '../models/base.models';
import {TournamentService} from './tournament.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockTournament: Tournament = {
  id: 1,
  owner: 42,
  name: 'Open Padel Lyon',
  category: 'P100',
  start_date: '2026-04-15',
  location: 'Lyon',
  league: 'Auvergne-Rhône-Alpes',
  gender: 'Homme',
  status: TournamentStatus.DRAFT,
  game_format: 'AMERICAN',
  configuration: 'POULES',
  estimated_match_duration: 60,
  pairs_count: 0,
  qr_code_url: 'https://example.com/public/tournaments/ABCDEF',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockRequest: TournamentRequest = {
  name: 'Open Padel Lyon',
  category: 'P100',
  start_date: '2026-04-15',
  location: 'Lyon',
  league: 'Auvergne-Rhône-Alpes',
  gender: 'Homme',
};

const mockPaginatedList: PaginatedResponse<Tournament> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockTournament],
};

const mockEnumChoices: EnumChoice[] = [
  { value: 'P100', label: 'P100' },
  { value: 'P250', label: 'P250' },
];

const mockBracketMatch: BracketMatch = {
  id: 1,
  round: 'FINALE',
  round_display: 'Finale',
  match_number: 1,
  pair1: 1,
  pair2: 2,
  game_format: 'C1',
  score: '6-3 6-4',
  winner_id: 1,
  child1: null as unknown as BracketMatch,
  child2: null as unknown as BracketMatch,
  disabled: false,
  pair1_can_be_placed: false,
  pair2_can_be_placed: false,
  status: MatchStatus.FINISHED,
  finished_at: '2026-04-15T14:30:00Z',
};

const mockMatch: Match = {
  id: 1,
  round: 'FINALE',
  round_display: 'Finale',
  match_number: 1,
  order: 1,
  pair1: 1,
  pair2: 2,
  game_format: 'C1',
  score: '6-3 6-4',
  winner_id: 1,
  status: MatchStatus.FINISHED,
  finished_at: '2026-04-15T14:30:00Z',
  started_at: '2026-04-15T13:30:00Z',
  estimated_start_at: null,
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('TournamentService', () => {
  let service: TournamentService;
  let httpSpy: jasmine.SpyObj<HttpRequesterService>;

  /**
   * Crée un nouveau module de test et injecte TournamentService.
   * `enumReturnValue` est retourné par httpSpy.get pour les observables
   * cachés (categories, genders, leagues, ...), déclenchés via defer()
   * à la première souscription plutôt qu'à la construction du service.
   */
  function buildService(enumReturnValue = of(mockEnumChoices)): { service: TournamentService; spy: jasmine.SpyObj<HttpRequesterService> } {
    const spy = jasmine.createSpyObj<HttpRequesterService>('HttpRequesterService', ['get', 'post', 'put', 'patch', 'delete']);
    spy.get.and.returnValue(enumReturnValue);
    TestBed.configureTestingModule({
      providers: [TournamentService, { provide: HttpRequesterService, useValue: spy }],
    });
    return { service: TestBed.inject(TournamentService), spy };
  }

  beforeEach(() => {
    // Le spy doit retourner un Observable car les méthodes cachées
    // (categories, genders, leagues, ...) utilisent defer() + shareReplay :
    // l'appel HTTP se déclenche à la première souscription, pas avant.
    ({ service, spy: httpSpy } = buildService());
    // Remet le compteur d'appels à zéro pour ne pas polluer les assertions
    // des tests qui vérifient toHaveBeenCalledOnceWith.
    httpSpy.get.calls.reset();
  });

  // -------------------------------------------------------------------------
  // Creation
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // getTournaments()
  // -------------------------------------------------------------------------

  describe('getTournaments()', () => {
    it('should call GET /api/v1/tournaments', () => {
      httpSpy.get.and.returnValue(of(mockPaginatedList));

      service.getTournaments().subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/tournaments', undefined);
    });

    it('should return the paginated list on success', (done) => {
      httpSpy.get.and.returnValue(of(mockPaginatedList));

      service.getTournaments().subscribe((res) => {
        expect(res).toEqual(mockPaginatedList);
        expect(res.results.length).toBe(1);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('500 Internal Server Error');
      httpSpy.get.and.returnValue(throwError(() => error));

      service.getTournaments().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // createTournament()
  // -------------------------------------------------------------------------

  describe('createTournament()', () => {
    it('should call POST /api/v1/tournaments with the correct body', () => {
      httpSpy.post.and.returnValue(of(mockTournament));

      service.createTournament(mockRequest).subscribe();

      expect(httpSpy.post).toHaveBeenCalledOnceWith('/tournaments', mockRequest);
    });

    it('should return the created tournament on success', (done) => {
      httpSpy.post.and.returnValue(of(mockTournament));

      service.createTournament(mockRequest).subscribe((res) => {
        expect(res).toEqual(mockTournament);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('400 Bad Request');
      httpSpy.post.and.returnValue(throwError(() => error));

      service.createTournament(mockRequest).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // getTournament()
  // -------------------------------------------------------------------------

  describe('getTournament()', () => {
    it('should call GET /api/v1/tournaments/{id}', () => {
      httpSpy.get.and.returnValue(of(mockTournament));

      service.getTournament(1).subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/tournaments/1');
    });

    it('should return the tournament on success', (done) => {
      httpSpy.get.and.returnValue(of(mockTournament));

      service.getTournament(1).subscribe((res) => {
        expect(res).toEqual(mockTournament);
        done();
      });
    });

    it('should propagate 404 errors', (done) => {
      const error = new Error('404 Not Found');
      httpSpy.get.and.returnValue(throwError(() => error));

      service.getTournament(999).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // updateTournament()
  // -------------------------------------------------------------------------

  describe('updateTournament()', () => {
    it('should call PUT /api/v1/tournaments/{id} with the correct body', () => {
      httpSpy.put.and.returnValue(of(mockTournament));

      service.updateTournament(1, mockRequest).subscribe();

      expect(httpSpy.put).toHaveBeenCalledOnceWith('/tournaments/1', mockRequest);
    });

    it('should return the updated tournament on success', (done) => {
      httpSpy.put.and.returnValue(of(mockTournament));

      service.updateTournament(1, mockRequest).subscribe((res) => {
        expect(res).toEqual(mockTournament);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('400 Bad Request');
      httpSpy.put.and.returnValue(throwError(() => error));

      service.updateTournament(1, mockRequest).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // deleteTournament()
  // -------------------------------------------------------------------------

  describe('deleteTournament()', () => {
    it('should call DELETE /api/v1/tournaments/{id}', () => {
      httpSpy.delete.and.returnValue(of(undefined));

      service.deleteTournament(1).subscribe();

      expect(httpSpy.delete).toHaveBeenCalledOnceWith('/tournaments/1');
    });

    it('should complete without a value on success', (done) => {
      httpSpy.delete.and.returnValue(of(undefined));

      service.deleteTournament(1).subscribe({
        next: (res) => {
          expect(res).toBeUndefined();
          done();
        },
      });
    });

    it('should propagate 404 errors', (done) => {
      const error = new Error('404 Not Found');
      httpSpy.delete.and.returnValue(throwError(() => error));

      service.deleteTournament(999).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // getCategories()
  // -------------------------------------------------------------------------

  describe('getCategories()', () => {
    it('should call GET /api/v1/tournaments/enums/categories when subscribed', () => {
      service.getCategories().subscribe();
      expect(httpSpy.get).toHaveBeenCalledWith('/tournaments/enums/categories');
    });

    it('should return the cached list of category choices', (done) => {
      service.getCategories().subscribe((res) => {
        expect(res).toEqual(mockEnumChoices);
        done();
      });
    });

    it('should propagate HTTP errors to subscribers', (done) => {
      const error = new Error('500 Internal Server Error');
      TestBed.resetTestingModule();
      const { service: errorService } = buildService(throwError(() => error));
      errorService.getCategories().subscribe({
        error: (err) => { expect(err).toBe(error); done(); },
      });
    });
  });

  // -------------------------------------------------------------------------
  // getGenders()
  // -------------------------------------------------------------------------

  describe('getGenders()', () => {
    it('should call GET /api/v1/tournaments/enums/genders when subscribed', () => {
      service.getGenders().subscribe();
      expect(httpSpy.get).toHaveBeenCalledWith('/tournaments/enums/genders');
    });

    it('should return the cached list of gender choices', (done) => {
      service.getGenders().subscribe((res) => {
        expect(res).toEqual(mockEnumChoices);
        done();
      });
    });

    it('should propagate HTTP errors to subscribers', (done) => {
      const error = new Error('500 Internal Server Error');
      TestBed.resetTestingModule();
      const { service: errorService } = buildService(throwError(() => error));
      errorService.getGenders().subscribe({
        error: (err) => { expect(err).toBe(error); done(); },
      });
    });
  });

  // -------------------------------------------------------------------------
  // getLeagues()
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // updateMatchScore()
  // -------------------------------------------------------------------------

  describe('updateMatchScore()', () => {
    const mockScoreRequest: ScoreRequest = { score: '6-3 6-4', winner_id: 1 };

    it('should call PATCH /api/v1/tournaments/{id}/matches/{matchId}/score with the correct body', () => {
      httpSpy.patch.and.returnValue(of(mockBracketMatch));

      service.updateMatchScore(1, 1, mockScoreRequest).subscribe();

      expect(httpSpy.patch).toHaveBeenCalledOnceWith(
        '/tournaments/1/matches/1/score',
        mockScoreRequest,
        { succes_message: 'Score enregistré' }
      );
    });

    it('should return the updated BracketMatch on success', (done) => {
      httpSpy.patch.and.returnValue(of(mockBracketMatch));

      service.updateMatchScore(1, 1, mockScoreRequest).subscribe((res) => {
        expect(res).toEqual(mockBracketMatch);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('400 Bad Request');
      httpSpy.patch.and.returnValue(throwError(() => error));

      service.updateMatchScore(1, 1, mockScoreRequest).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // updateMatchesOrder()
  // -------------------------------------------------------------------------

  describe('updateMatchesOrder()', () => {
    const mockReorderRequest: ReorderMatchesRequest = { match_ids: [3, 7, 1] };
    const mockReorderedMatches: Match[] = [
      { ...mockMatch, id: 3 },
      { ...mockMatch, id: 7 },
      { ...mockMatch, id: 1 },
    ];

    it('should call PATCH /api/v1/tournaments/{id}/matches/order with the correct body', () => {
      httpSpy.patch.and.returnValue(of(mockReorderedMatches));

      service.updateMatchesOrder(1, mockReorderRequest).subscribe();

      expect(httpSpy.patch).toHaveBeenCalledOnceWith(
        '/tournaments/1/matches/order',
        mockReorderRequest,
      );
    });

    it('should return the updated Match[] on success', (done) => {
      httpSpy.patch.and.returnValue(of(mockReorderedMatches));

      service.updateMatchesOrder(1, mockReorderRequest).subscribe((res) => {
        expect(res).toEqual(mockReorderedMatches);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('409 Conflict');
      httpSpy.patch.and.returnValue(throwError(() => error));

      service.updateMatchesOrder(1, mockReorderRequest).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // deleteMatchScore()
  // -------------------------------------------------------------------------

  describe('deleteMatchScore()', () => {
    it('should call DELETE /api/v1/tournaments/{id}/matches/{matchId}/score with the correct options', () => {
      httpSpy.delete.and.returnValue(of(undefined));

      service.deleteMatchScore(1, 1).subscribe();

      expect(httpSpy.delete).toHaveBeenCalledOnceWith(
        '/tournaments/1/matches/1/score',
        { succes_message: 'Score supprimé' }
      );
    });

    it('should complete without a value on success', (done) => {
      httpSpy.delete.and.returnValue(of(undefined));

      service.deleteMatchScore(1, 1).subscribe({
        next: (res) => {
          expect(res).toBeUndefined();
          done();
        },
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('400 Bad Request');
      httpSpy.delete.and.returnValue(throwError(() => error));

      service.deleteMatchScore(1, 1).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // getMatches()
  // -------------------------------------------------------------------------

  describe('getMatches()', () => {
    it('should call GET /api/v1/tournaments/{id}/matches with no params when no statuses given', () => {
      httpSpy.get.and.returnValue(of([mockMatch]));

      service.getMatches(1).subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/tournaments/1/matches', undefined);
    });

    it('should call GET /api/v1/tournaments/{id}/matches with repeatable status params when statuses given', () => {
      httpSpy.get.and.returnValue(of([mockMatch]));

      service.getMatches(1, [MatchStatus.UPCOMING, MatchStatus.STARTED]).subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/tournaments/1/matches', {
        status: [MatchStatus.UPCOMING, MatchStatus.STARTED],
      });
    });

    it('should treat an empty statuses array as no filter', () => {
      httpSpy.get.and.returnValue(of([mockMatch]));

      service.getMatches(1, []).subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/tournaments/1/matches', undefined);
    });

    it('should return the list of matches on success', (done) => {
      httpSpy.get.and.returnValue(of([mockMatch]));

      service.getMatches(1).subscribe((res) => {
        expect(res).toEqual([mockMatch]);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('500 Internal Server Error');
      httpSpy.get.and.returnValue(throwError(() => error));

      service.getMatches(1).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getLeagues()', () => {
    it('should call GET /api/v1/tournaments/enums/leagues when subscribed', () => {
      service.getLeagues().subscribe();
      expect(httpSpy.get).toHaveBeenCalledWith('/tournaments/enums/leagues');
    });

    it('should return the cached list of league choices', (done) => {
      service.getLeagues().subscribe((res) => {
        expect(res).toEqual(mockEnumChoices);
        done();
      });
    });

    it('should propagate HTTP errors to subscribers', (done) => {
      const error = new Error('500 Internal Server Error');
      TestBed.resetTestingModule();
      const { service: errorService } = buildService(throwError(() => error));
      errorService.getLeagues().subscribe({
        error: (err) => { expect(err).toBe(error); done(); },
      });
    });
  });
});
