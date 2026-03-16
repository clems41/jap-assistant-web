import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import {
  TournamentService,
  Tournament,
  TournamentRequest,
  PaginatedTournamentList,
  EnumChoice,
} from './tournament.service';
import { HttpRequesterService } from './http-requester.service';

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

const mockPaginatedList: PaginatedTournamentList = {
  count: 1,
  next: null,
  previous: null,
  results: [mockTournament],
};

const mockEnumChoices: EnumChoice[] = [
  { value: 'P100', label: 'P100' },
  { value: 'P250', label: 'P250' },
];

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('TournamentService', () => {
  let service: TournamentService;
  let httpSpy: jasmine.SpyObj<HttpRequesterService>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj<HttpRequesterService>(
      'HttpRequesterService',
      ['get', 'post', 'put', 'delete'],
    );

    TestBed.configureTestingModule({
      providers: [
        TournamentService,
        { provide: HttpRequesterService, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(TournamentService);
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

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/api/v1/tournaments');
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

      expect(httpSpy.post).toHaveBeenCalledOnceWith('/api/v1/tournaments', mockRequest);
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

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/api/v1/tournaments/1');
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

      expect(httpSpy.put).toHaveBeenCalledOnceWith('/api/v1/tournaments/1', mockRequest);
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

      expect(httpSpy.delete).toHaveBeenCalledOnceWith('/api/v1/tournaments/1');
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
    it('should call GET /api/v1/tournaments/enums/categories', () => {
      httpSpy.get.and.returnValue(of(mockEnumChoices));

      service.getCategories().subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/api/v1/tournaments/enums/categories');
    });

    it('should return the list of category choices', (done) => {
      httpSpy.get.and.returnValue(of(mockEnumChoices));

      service.getCategories().subscribe((res) => {
        expect(res).toEqual(mockEnumChoices);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('500 Internal Server Error');
      httpSpy.get.and.returnValue(throwError(() => error));

      service.getCategories().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // getGenders()
  // -------------------------------------------------------------------------

  describe('getGenders()', () => {
    it('should call GET /api/v1/tournaments/enums/genders', () => {
      httpSpy.get.and.returnValue(of(mockEnumChoices));

      service.getGenders().subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/api/v1/tournaments/enums/genders');
    });

    it('should return the list of gender choices', (done) => {
      httpSpy.get.and.returnValue(of(mockEnumChoices));

      service.getGenders().subscribe((res) => {
        expect(res).toEqual(mockEnumChoices);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('500 Internal Server Error');
      httpSpy.get.and.returnValue(throwError(() => error));

      service.getGenders().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // getLeagues()
  // -------------------------------------------------------------------------

  describe('getLeagues()', () => {
    it('should call GET /api/v1/tournaments/enums/leagues', () => {
      httpSpy.get.and.returnValue(of(mockEnumChoices));

      service.getLeagues().subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/api/v1/tournaments/enums/leagues');
    });

    it('should return the list of league choices', (done) => {
      httpSpy.get.and.returnValue(of(mockEnumChoices));

      service.getLeagues().subscribe((res) => {
        expect(res).toEqual(mockEnumChoices);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('500 Internal Server Error');
      httpSpy.get.and.returnValue(throwError(() => error));

      service.getLeagues().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
