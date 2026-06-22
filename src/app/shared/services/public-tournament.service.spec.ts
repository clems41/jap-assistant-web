import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpRequesterService } from './http-requester.service';
import { MatchStatus, TournamentStatus } from '../models/tournament.models';
import { PublicMatch, PublicTournament, PublicBracketResponse, PublicBracketMatch } from '../models/public-tournament.models';
import { PublicTournamentService } from './public-tournament.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockPublicTournament: PublicTournament = {
  public_code: 'ABCD1234',
  name: 'Open Padel Lyon',
  category: 'P100',
  start_date: '2026-04-15',
  location: 'Lyon',
  league: 'Auvergne-Rhône-Alpes',
  gender: 'Homme',
  game_format: 'AMERICAN',
  configuration: 'POULES',
  estimated_match_duration: 60,
  status: TournamentStatus.STARTED,
  pairs_count: 8,
};

const mockPublicMatch: PublicMatch = {
  round: 'FINALE',
  round_display: 'Finale',
  match_number: 1,
  order: 1,
  pair1: null,
  pair2: null,
  winner: null,
  game_format: 'C1',
  score: '',
  status: MatchStatus.UPCOMING,
  status_display: 'À venir',
  started_at: null,
  finished_at: null,
  estimated_start_at: null,
};

const mockPublicBracketMatch: PublicBracketMatch = {
  round: 'FINALE',
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

const mockPublicBracketResponse: PublicBracketResponse = {
  root_match: mockPublicBracketMatch,
  classification_brackets: [],
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('PublicTournamentService', () => {
  let service: PublicTournamentService;
  let httpSpy: jasmine.SpyObj<HttpRequesterService>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj<HttpRequesterService>('HttpRequesterService', ['get']);
    TestBed.configureTestingModule({
      providers: [PublicTournamentService, { provide: HttpRequesterService, useValue: httpSpy }],
    });
    service = TestBed.inject(PublicTournamentService);
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
  // getPublicTournament()
  // -------------------------------------------------------------------------

  describe('getPublicTournament()', () => {
    it('should call GET /api/v1/public/tournaments/{code} without surfacing errors', () => {
      httpSpy.get.and.returnValue(of(mockPublicTournament));

      service.getPublicTournament('ABCD1234').subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith(
        '/public/tournaments/ABCD1234',
        undefined,
        { show_error: false },
      );
    });

    it('should return the public tournament on success', (done) => {
      httpSpy.get.and.returnValue(of(mockPublicTournament));

      service.getPublicTournament('ABCD1234').subscribe((res) => {
        expect(res).toEqual(mockPublicTournament);
        done();
      });
    });

    it('should not transform the case of the code', () => {
      httpSpy.get.and.returnValue(of(mockPublicTournament));

      service.getPublicTournament('aBcD1234').subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith(
        '/public/tournaments/aBcD1234',
        undefined,
        { show_error: false },
      );
    });

    it('should propagate a 404 error (unknown code) to the subscriber', (done) => {
      const error = new Error('404 Not Found');
      httpSpy.get.and.returnValue(throwError(() => error));

      service.getPublicTournament('UNKNOWN1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // getPublicMatches()
  // -------------------------------------------------------------------------

  describe('getPublicMatches()', () => {
    it('should call GET /api/v1/public/tournaments/{code}/matches with no params when no statuses given', () => {
      httpSpy.get.and.returnValue(of([mockPublicMatch]));

      service.getPublicMatches('ABCD1234').subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith(
        '/public/tournaments/ABCD1234/matches',
        undefined,
        { show_error: false },
      );
    });

    it('should call GET /api/v1/public/tournaments/{code}/matches with repeatable status params when statuses given', () => {
      httpSpy.get.and.returnValue(of([mockPublicMatch]));

      service.getPublicMatches('ABCD1234', [MatchStatus.UPCOMING, MatchStatus.STARTED]).subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith(
        '/public/tournaments/ABCD1234/matches',
        { status: [MatchStatus.UPCOMING, MatchStatus.STARTED] },
        { show_error: false },
      );
    });

    it('should treat an empty statuses array as no filter', () => {
      httpSpy.get.and.returnValue(of([mockPublicMatch]));

      service.getPublicMatches('ABCD1234', []).subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith(
        '/public/tournaments/ABCD1234/matches',
        undefined,
        { show_error: false },
      );
    });

    it('should return the list of public matches on success', (done) => {
      httpSpy.get.and.returnValue(of([mockPublicMatch]));

      service.getPublicMatches('ABCD1234').subscribe((res) => {
        expect(res).toEqual([mockPublicMatch]);
        done();
      });
    });

    it('should return an empty array when the tournament has no matches', (done) => {
      httpSpy.get.and.returnValue(of([]));

      service.getPublicMatches('ABCD1234').subscribe((res) => {
        expect(res).toEqual([]);
        done();
      });
    });

    it('should propagate a 404 error (unknown code) to the subscriber', (done) => {
      const error = new Error('404 Not Found');
      httpSpy.get.and.returnValue(throwError(() => error));

      service.getPublicMatches('UNKNOWN1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // getPublicBracket()
  // -------------------------------------------------------------------------

  describe('getPublicBracket()', () => {
    it('should call GET /api/v1/public/tournaments/{code}/bracket without surfacing errors', () => {
      httpSpy.get.and.returnValue(of(mockPublicBracketResponse));

      service.getPublicBracket('ABCD1234').subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith(
        '/public/tournaments/ABCD1234/bracket',
        undefined,
        { show_error: false },
      );
    });

    it('should return the public bracket response on success', (done) => {
      httpSpy.get.and.returnValue(of(mockPublicBracketResponse));

      service.getPublicBracket('ABCD1234').subscribe((res) => {
        expect(res).toEqual(mockPublicBracketResponse);
        done();
      });
    });

    it('should propagate a 404 error (bracket not generated yet) to the subscriber', (done) => {
      const error = new Error('404 Not Found');
      httpSpy.get.and.returnValue(throwError(() => error));

      service.getPublicBracket('ABCD1234').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
