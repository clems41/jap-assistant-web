import { isPlatformServer } from '@angular/common';
import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { Observable, Subject, defer, filter, map, timer } from 'rxjs';
import { retry } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Environment } from '../../../environments/environment.model';
import { ENVIRONMENT } from '../core/tokens/environment.token';
import { ResourceName, TournamentUpdateMessage } from '../models/public-tournament.models';
import { buildPublicTournamentWebSocketUrl } from '../utils/websocket-url.util';

/**
 * Paliers de backoff exponentiel pour la reconnexion : 1s, 2s, 4s, 8s, 16s, puis plafonné
 * à 30s pour toutes les tentatives suivantes. `retryCount` est 1-indexé (RxJS `retry`).
 */
const BACKOFF_DELAYS_MS = [1000, 2000, 4000, 8000, 16000, 30000];

function backoffMs(retryCount: number): number {
  const index = Math.min(retryCount - 1, BACKOFF_DELAYS_MS.length - 1);
  return BACKOFF_DELAYS_MS[index];
}

/**
 * Connexion WebSocket unique par tournoi public affiché — sert uniquement à déclencher des
 * refetchs REST (signal d'invalidation), ne transporte jamais de données de tournoi.
 * `providedIn: 'root'` : singleton volontaire, comme tous les autres services de ce projet.
 */
@Injectable({ providedIn: 'root' })
export class PublicTournamentUpdatesService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private environment = inject<Environment>(ENVIRONMENT);

  private socket: WebSocketSubject<TournamentUpdateMessage> | null = null;
  private openCount = 0;

  private readonly messagesSubject$ = new Subject<TournamentUpdateMessage>();
  readonly messages$: Observable<TournamentUpdateMessage> = this.messagesSubject$.asObservable();

  private readonly reconnectedSubject$ = new Subject<void>();
  readonly reconnected$: Observable<void> = this.reconnectedSubject$.asObservable();

  onResource(resource: ResourceName): Observable<void> {
    return this.messages$.pipe(
      filter((message) => message.resources.includes(resource)),
      map(() => void 0),
    );
  }

  connect(code: string): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    // Défensif : un changement de :code via route reuse ne détruit pas forcément le
    // composant, donc une connexion déjà ouverte doit être proprement fermée avant d'en
    // ouvrir une nouvelle.
    this.disconnect();

    const url = buildPublicTournamentWebSocketUrl(
      this.environment.apiBaseUrl,
      window.location.origin,
      code,
    );

    // `defer` ensures each retry attempt calls `createSocket` again — opening a genuinely
    // new connection — instead of resubscribing to the same (now closed) socket instance.
    defer(() => {
      this.socket = this.createSocket(url);
      return this.socket;
    })
      .pipe(
        retry({
          delay: (_error, retryCount) => timer(backoffMs(retryCount)),
        }),
      )
      .subscribe({
        next: (message) => this.messagesSubject$.next(message),
      });

    // Le client n'envoie jamais rien sur le socket : contrat serveur -> client uniquement.
    // Volontaire — ne pas ajouter de ping/ack ici.
  }

  disconnect(): void {
    this.socket?.complete();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Seam de test : permet de substituer un simple `Subject` au `WebSocketSubject` réel dans
   * les specs, sans avoir à mocker le module `rxjs/webSocket`.
   */
  protected createSocket(url: string): WebSocketSubject<TournamentUpdateMessage> {
    return webSocket<TournamentUpdateMessage>({
      url,
      openObserver: {
        next: () => this.handleOpen(),
      },
    });
  }

  private handleOpen(): void {
    this.openCount += 1;
    if (this.openCount > 1) {
      this.reconnectedSubject$.next();
    }
  }
}
