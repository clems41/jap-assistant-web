import { PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { Environment } from '../../../environments/environment.model';
import { ENVIRONMENT } from '../core/tokens/environment.token';
import { TournamentUpdateMessage } from '../models/public-tournament.models';
import { PublicTournamentUpdatesService } from './public-tournament-updates.service';

const mockEnvironment: Environment = {
  production: false,
  envName: 'local',
  apiBaseUrl: 'http://0.0.0.0:8000/api/v1',
};

/**
 * Double de `WebSocketSubject` utilisé dans les tests : un `Subject` standard suffit, puisque
 * le service n'appelle jamais que `.subscribe()` et `.complete()` sur le socket — exactement
 * l'API exposée par un `Subject` RxJS classique. `openObserver.next()` est appelé manuellement
 * par les tests pour simuler une ouverture de connexion (le vrai `WebSocketSubject` le ferait
 * automatiquement à la connexion réelle).
 */
class FakeSocket extends Subject<TournamentUpdateMessage> {
  completeSpy = jasmine.createSpy('complete');

  override complete(): void {
    this.completeSpy();
    super.complete();
  }
}

describe('PublicTournamentUpdatesService', () => {
  let service: PublicTournamentUpdatesService;
  let createSocketSpy: jasmine.Spy;
  let sockets: FakeSocket[];

  function configure(platformId: 'browser' | 'server' = 'browser'): void {
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        { provide: ENVIRONMENT, useValue: mockEnvironment },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    });

    service = TestBed.inject(PublicTournamentUpdatesService);

    sockets = [];

    // `createSocket` is the seam: it's the only place the service touches `webSocket()`.
    // Replacing it lets tests drive the lifecycle (open/next/error) without a real socket.
    createSocketSpy = spyOn(
      service as unknown as { createSocket(url: string): WebSocketSubject<TournamentUpdateMessage> },
      'createSocket',
    ).and.callFake(() => {
      const fake = new FakeSocket();
      sockets.push(fake);
      // The fake stands in for the openObserver-equivalent behavior too: tests call
      // `triggerOpen()` to simulate the socket firing its openObserver.
      return fake as unknown as WebSocketSubject<TournamentUpdateMessage>;
    });
  }

  /**
   * Simulates the real `webSocket()` openObserver firing — invokes the service's private
   * `handleOpen()` the same way the real `openObserver.next` callback would on connection.
   */
  function triggerOpen(): void {
    (service as unknown as { handleOpen(): void }).handleOpen();
  }

  afterEach(() => {
    service.disconnect();
  });

  describe('initial state', () => {
    beforeEach(() => configure());

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should not create a socket before connect() is called', () => {
      expect(createSocketSpy).not.toHaveBeenCalled();
    });
  });

  describe('connect()', () => {
    beforeEach(() => configure());

    it('should create a socket with a URL built from the environment apiBaseUrl and window origin', () => {
      service.connect('CODE1');

      expect(createSocketSpy).toHaveBeenCalledTimes(1);
      const url = createSocketSpy.calls.argsFor(0)[0] as string;
      expect(url).toContain('/ws/public/tournaments/CODE1/');
      expect(url.startsWith('ws://') || url.startsWith('wss://')).toBeTrue();
    });

    it('should tear down the previous socket before creating a new one when called twice in a row', () => {
      service.connect('CODE1');
      const firstSocket = sockets[0];

      service.connect('CODE2');

      expect(firstSocket.completeSpy).toHaveBeenCalledTimes(1);
      expect(createSocketSpy).toHaveBeenCalledTimes(2);
      expect(sockets.length).toBe(2);
    });

    it('should not create a socket on the server platform (SSR guard)', () => {
      configure('server');

      service.connect('CODE1');

      expect(createSocketSpy).not.toHaveBeenCalled();
    });
  });

  describe('disconnect()', () => {
    beforeEach(() => configure());

    it('should complete the current socket', () => {
      service.connect('CODE1');
      const socket = sockets[0];

      service.disconnect();

      expect(socket.completeSpy).toHaveBeenCalledTimes(1);
    });

    it('should be a no-op when not connected', () => {
      expect(() => service.disconnect()).not.toThrow();
      expect(createSocketSpy).not.toHaveBeenCalled();
    });

    it('should prevent further automatic reconnects after disconnecting (error after disconnect creates no new socket)', fakeAsync(() => {
      service.connect('CODE1');
      const socket = sockets[0];

      service.disconnect();
      socket.error(new Event('error'));

      tick(60000);

      expect(sockets.length).toBe(1);
    }));
  });

  describe('messages$ / onResource()', () => {
    beforeEach(() => configure());

    it('should reach onResource("matches") when the message resources include "matches"', () => {
      service.connect('CODE1');
      const socket = sockets[0];

      let received = false;
      service.onResource('matches').subscribe(() => (received = true));

      socket.next({ type: 'tournament.update', resources: ['matches', 'bracket'] });

      expect(received).toBeTrue();
    });

    it('should NOT reach onResource("pairs") for a message that does not include "pairs"', () => {
      service.connect('CODE1');
      const socket = sockets[0];

      let received = false;
      service.onResource('pairs').subscribe(() => (received = true));

      socket.next({ type: 'tournament.update', resources: ['matches', 'bracket'] });

      expect(received).toBeFalse();
    });

    it('should emit on messages$ for every message regardless of resource filtering', () => {
      service.connect('CODE1');
      const socket = sockets[0];

      const received: TournamentUpdateMessage[] = [];
      service.messages$.subscribe((m) => received.push(m));

      socket.next({ type: 'tournament.update', resources: ['tournament'] });
      socket.next({ type: 'tournament.update', resources: ['pairs', 'matches'] });

      expect(received.length).toBe(2);
      expect(received[1].resources).toEqual(['pairs', 'matches']);
    });

    it('should support a message listing all 4 resources', () => {
      service.connect('CODE1');
      const socket = sockets[0];

      let count = 0;
      service.onResource('bracket').subscribe(() => count++);

      socket.next({
        type: 'tournament.update',
        resources: ['tournament', 'matches', 'bracket', 'pairs'],
      });

      expect(count).toBe(1);
    });
  });

  describe('reconnected$', () => {
    beforeEach(() => configure());

    it('should NOT emit on the very first successful open', () => {
      service.connect('CODE1');

      let emitted = false;
      service.reconnected$.subscribe(() => (emitted = true));

      triggerOpen();

      expect(emitted).toBeFalse();
    });

    it('should emit starting from the second successful open', () => {
      service.connect('CODE1');

      let emitCount = 0;
      service.reconnected$.subscribe(() => emitCount++);

      triggerOpen(); // 1st open — no emission
      triggerOpen(); // 2nd open — emits
      triggerOpen(); // 3rd open — emits

      expect(emitCount).toBe(2);
    });
  });

  describe('reconnection backoff', () => {
    beforeEach(() => configure());

    it('should follow the 1s,2s,4s,8s,16s,30s schedule and stay capped at 30s afterwards', fakeAsync(() => {
      service.connect('CODE1');
      expect(sockets.length).toBe(1);

      const delays = [1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000];

      delays.forEach((delayMs, i) => {
        const countBefore = sockets.length;

        // Error out the current socket to trigger the retry/backoff timer.
        sockets[sockets.length - 1].error(new Event('error'));

        // Just before the expected delay: no new socket yet.
        tick(delayMs - 1);
        expect(sockets.length).toBe(countBefore, `no new socket before ${delayMs}ms (retry #${i + 1})`);

        // At the expected delay: a new socket has been created.
        tick(1);
        expect(sockets.length).toBe(countBefore + 1, `new socket at ${delayMs}ms (retry #${i + 1})`);
      });
    }));
  });
});
