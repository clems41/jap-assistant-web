import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpRequesterService } from './http-requester.service';
import { Pair, PairRequest, Player } from '../models/pair.models';
import { PaginatedResponse } from '../models/base.models';
import { PairService } from './pair.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockPlayer1: Player = {
  id: 1,
  last_name: 'Dupont',
  first_name: 'Alice',
  license_number: 'LIC001',
  phone: '0601020304',
  ranking: 3,
};

const mockPlayer2: Player = {
  id: 2,
  last_name: 'Martin',
  first_name: 'Bob',
  license_number: 'LIC002',
  ranking: null,
};

const mockPair: Pair = {
  id: 10,
  player1: mockPlayer1,
  player2: mockPlayer2,
  weight: null,
};

const mockPairRequest: PairRequest = {
  player1: {
    last_name: 'Dupont',
    first_name: 'Alice',
    license_number: 'LIC001',
    phone: '0601020304',
    ranking: 3,
  },
  player2: {
    last_name: 'Martin',
    first_name: 'Bob',
    license_number: 'LIC002',
    ranking: null,
  },
  weight: null,
};

const mockPaginatedPairs: PaginatedResponse<Pair> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockPair],
};

const TOURNAMENT_ID = 5;

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('PairService', () => {
  let service: PairService;
  let httpSpy: jasmine.SpyObj<HttpRequesterService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj<HttpRequesterService>('HttpRequesterService', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({
      providers: [PairService, { provide: HttpRequesterService, useValue: spy }],
    });
    service = TestBed.inject(PairService);
    httpSpy = TestBed.inject(HttpRequesterService) as jasmine.SpyObj<HttpRequesterService>;
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
  // getPairs()
  // -------------------------------------------------------------------------

  describe('getPairs()', () => {
    it('should call GET /api/v1/tournaments/{id}/pairs', () => {
      httpSpy.get.and.returnValue(of(mockPaginatedPairs));

      service.getPairs(TOURNAMENT_ID).subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/tournaments/5/pairs', undefined);
    });

    it('should forward filters as params', () => {
      httpSpy.get.and.returnValue(of(mockPaginatedPairs));
      const filters = { page: 2, page_size: 10 };

      service.getPairs(TOURNAMENT_ID, filters).subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/tournaments/5/pairs', filters);
    });

    it('should return the paginated list on success', (done) => {
      httpSpy.get.and.returnValue(of(mockPaginatedPairs));

      service.getPairs(TOURNAMENT_ID).subscribe((res) => {
        expect(res).toEqual(mockPaginatedPairs);
        expect(res.results.length).toBe(1);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('500 Internal Server Error');
      httpSpy.get.and.returnValue(throwError(() => error));

      service.getPairs(TOURNAMENT_ID).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // createPair()
  // -------------------------------------------------------------------------

  describe('createPair()', () => {
    it('should call POST /api/v1/tournaments/{id}/pairs with the correct body', () => {
      httpSpy.post.and.returnValue(of(mockPair));

      service.createPair(TOURNAMENT_ID, mockPairRequest).subscribe();

      expect(httpSpy.post).toHaveBeenCalledOnceWith('/tournaments/5/pairs', mockPairRequest);
    });

    it('should return the created pair on success', (done) => {
      httpSpy.post.and.returnValue(of(mockPair));

      service.createPair(TOURNAMENT_ID, mockPairRequest).subscribe((res) => {
        expect(res).toEqual(mockPair);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('400 Bad Request');
      httpSpy.post.and.returnValue(throwError(() => error));

      service.createPair(TOURNAMENT_ID, mockPairRequest).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // getPair()
  // -------------------------------------------------------------------------

  describe('getPair()', () => {
    it('should call GET /api/v1/tournaments/{id}/pairs/{pairId}', () => {
      httpSpy.get.and.returnValue(of(mockPair));

      service.getPair(TOURNAMENT_ID, 10).subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith('/tournaments/5/pairs/10');
    });

    it('should return the pair on success', (done) => {
      httpSpy.get.and.returnValue(of(mockPair));

      service.getPair(TOURNAMENT_ID, 10).subscribe((res) => {
        expect(res).toEqual(mockPair);
        done();
      });
    });

    it('should propagate 404 errors', (done) => {
      const error = new Error('404 Not Found');
      httpSpy.get.and.returnValue(throwError(() => error));

      service.getPair(TOURNAMENT_ID, 999).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // updatePair()
  // -------------------------------------------------------------------------

  describe('updatePair()', () => {
    it('should call PUT /api/v1/tournaments/{id}/pairs/{pairId} with the correct body', () => {
      httpSpy.put.and.returnValue(of(mockPair));

      service.updatePair(TOURNAMENT_ID, 10, mockPairRequest).subscribe();

      expect(httpSpy.put).toHaveBeenCalledOnceWith('/tournaments/5/pairs/10', mockPairRequest);
    });

    it('should return the updated pair on success', (done) => {
      httpSpy.put.and.returnValue(of(mockPair));

      service.updatePair(TOURNAMENT_ID, 10, mockPairRequest).subscribe((res) => {
        expect(res).toEqual(mockPair);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('400 Bad Request');
      httpSpy.put.and.returnValue(throwError(() => error));

      service.updatePair(TOURNAMENT_ID, 10, mockPairRequest).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // deletePair()
  // -------------------------------------------------------------------------

  describe('deletePair()', () => {
    it('should call DELETE /api/v1/tournaments/{id}/pairs/{pairId}', () => {
      httpSpy.delete.and.returnValue(of(undefined));

      service.deletePair(TOURNAMENT_ID, 10).subscribe();

      expect(httpSpy.delete).toHaveBeenCalledOnceWith('/tournaments/5/pairs/10');
    });

    it('should complete without a value on success', (done) => {
      httpSpy.delete.and.returnValue(of(undefined));

      service.deletePair(TOURNAMENT_ID, 10).subscribe({
        next: (res) => {
          expect(res).toBeUndefined();
          done();
        },
      });
    });

    it('should propagate 404 errors', (done) => {
      const error = new Error('404 Not Found');
      httpSpy.delete.and.returnValue(throwError(() => error));

      service.deletePair(TOURNAMENT_ID, 999).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // importPairs()
  // -------------------------------------------------------------------------

  describe('importPairs()', () => {
    it('should call POST /api/v1/tournaments/{id}/pairs/import with FormData', () => {
      httpSpy.post.and.returnValue(of([mockPair]));
      const file = new File(['content'], 'pairs.csv', { type: 'text/csv' });

      service.importPairs(TOURNAMENT_ID, file).subscribe();

      const [path, body] = httpSpy.post.calls.mostRecent().args;
      expect(path).toBe('/tournaments/5/pairs/import');
      expect(body).toBeInstanceOf(FormData);
      expect((body as FormData).get('file')).toBe(file);
    });

    it('should return the list of imported pairs on success', (done) => {
      const importedPairs = [mockPair];
      httpSpy.post.and.returnValue(of(importedPairs));
      const file = new File(['content'], 'pairs.csv', { type: 'text/csv' });

      service.importPairs(TOURNAMENT_ID, file).subscribe((res) => {
        expect(res).toEqual(importedPairs);
        expect(res.length).toBe(1);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new Error('400 Bad Request');
      httpSpy.post.and.returnValue(throwError(() => error));
      const file = new File(['content'], 'pairs.csv', { type: 'text/csv' });

      service.importPairs(TOURNAMENT_ID, file).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
