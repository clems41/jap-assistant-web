import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpRequesterService } from './http-requester.service';
import { BracketApiService } from './bracket-api.service';
import { BracketStatePayload, BracketStateResponse } from '../models/bracket.models';
import { Player, Pair } from '../models/pair.models';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockPlayer1: Player = {
  id: 1, last_name: 'Dupont', first_name: 'Alice', license_number: 'LIC001', ranking: 1,
};
const mockPlayer2: Player = {
  id: 2, last_name: 'Martin', first_name: 'Bob', license_number: 'LIC002', ranking: 2,
};
const mockPair: Pair = { id: 10, player1: mockPlayer1, player2: mockPlayer2, weight: 1 };

const mockStateResponse: BracketStateResponse = {
  id: 7,
  tournament_id: 42,
  dimension: 16,
  nb_top_seeds: 2,
  slots: [
    { slot_title: 'R16 #1', pair: mockPair },
  ],
};

const mockPayload: BracketStatePayload = {
  dimension: 16,
  nb_top_seeds: 2,
  slots: [{ slot_title: 'R16 #1', pair_id: 10 }],
};

const TOURNAMENT_ID = 42;

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('BracketApiService', () => {
  let service: BracketApiService;
  let httpSpy: jasmine.SpyObj<HttpRequesterService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj<HttpRequesterService>('HttpRequesterService', ['get', 'put']);
    TestBed.configureTestingModule({
      providers: [BracketApiService, { provide: HttpRequesterService, useValue: spy }],
    });
    service = TestBed.inject(BracketApiService);
    httpSpy = TestBed.inject(HttpRequesterService) as jasmine.SpyObj<HttpRequesterService>;
  });

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // getBracketState()
  // -------------------------------------------------------------------------

  describe('getBracketState()', () => {
    it('should call GET /tournaments/{id}/bracket with show_error: false', () => {
      httpSpy.get.and.returnValue(of(mockStateResponse));

      service.getBracketState(TOURNAMENT_ID).subscribe();

      expect(httpSpy.get).toHaveBeenCalledOnceWith(
        '/tournaments/42/bracket',
        undefined,
        { show_error: false }
      );
    });

    it('should return the bracket state on success', (done) => {
      httpSpy.get.and.returnValue(of(mockStateResponse));

      service.getBracketState(TOURNAMENT_ID).subscribe((res) => {
        expect(res).toEqual(mockStateResponse);
        done();
      });
    });

    it('should return null on 404', (done) => {
      const notFound = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      httpSpy.get.and.returnValue(throwError(() => notFound));

      service.getBracketState(TOURNAMENT_ID).subscribe((res) => {
        expect(res).toBeNull();
        done();
      });
    });

    it('should propagate non-404 errors', (done) => {
      const serverError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
      httpSpy.get.and.returnValue(throwError(() => serverError));

      service.getBracketState(TOURNAMENT_ID).subscribe({
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(500);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // saveBracketState()
  // -------------------------------------------------------------------------

  describe('saveBracketState()', () => {
    it('should call PUT /tournaments/{id}/bracket with the correct body and success message', () => {
      httpSpy.put.and.returnValue(of(mockStateResponse));

      service.saveBracketState(TOURNAMENT_ID, mockPayload).subscribe();

      expect(httpSpy.put).toHaveBeenCalledOnceWith(
        '/tournaments/42/bracket',
        mockPayload,
        { succes_message: 'Tableau enregistré' }
      );
    });

    it('should return the updated bracket state on success', (done) => {
      httpSpy.put.and.returnValue(of(mockStateResponse));

      service.saveBracketState(TOURNAMENT_ID, mockPayload).subscribe((res) => {
        expect(res).toEqual(mockStateResponse);
        done();
      });
    });

    it('should propagate HTTP errors', (done) => {
      const error = new HttpErrorResponse({ status: 400, statusText: 'Bad Request' });
      httpSpy.put.and.returnValue(throwError(() => error));

      service.saveBracketState(TOURNAMENT_ID, mockPayload).subscribe({
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(400);
          done();
        },
      });
    });
  });
});
