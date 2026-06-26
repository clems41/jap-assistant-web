import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { merge } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { Bracket, TournamentStatus } from '../../shared/models/tournament.models';
import { Pair } from '../../shared/models/pair.models';
import { PublicTournament } from '../../shared/models/public-tournament.models';
import { PublicTournamentService } from '../../shared/services/public-tournament.service';
import { PublicTournamentUpdatesService } from '../../shared/services/public-tournament-updates.service';
import { mapPublicBracketResponse } from '../../shared/utils/public-tournament.utils';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { PublicTournamentInfoComponent } from './public-tournament-info/public-tournament-info.component';
import { PublicTournamentPlayersComponent } from './public-tournament-players/public-tournament-players.component';
import { PublicTournamentMatchesComponent } from './public-tournament-matches/public-tournament-matches.component';
import { BracketChartComponent } from '../tournaments/setup/brackets/bracket-chart/bracket-chart.component';
import { ClassificationBracketsComponent } from '../tournaments/setup/classification-brackets/classification-brackets.component';

@Component({
  selector: 'app-public-tournament',
  standalone: true,
  imports: [
    RouterLink,
    TabsModule,
    LoadingSpinnerComponent,
    PublicTournamentInfoComponent,
    PublicTournamentPlayersComponent,
    PublicTournamentMatchesComponent,
    BracketChartComponent,
    ClassificationBracketsComponent,
  ],
  templateUrl: './public-tournament.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Les onglets PrimeNG (p-tabs) manipulent leur DOM (indicateur actif, etc.) d'une façon qui
  // entre parfois en conflit avec la réconciliation d'hydratation SSR sur cette page : après un
  // rechargement complet, les clics restent visuellement actifs (hover OK) mais ne déclenchent
  // plus rien. On exclut donc cette page de l'hydratation — elle reste rendue côté serveur pour
  // le premier affichage, mais le client la reconstruit entièrement au bootstrap au lieu de
  // tenter de réutiliser le DOM serveur, ce qui garantit des écouteurs correctement attachés.
  host: { ngSkipHydration: 'true' },
})
export class PublicTournamentPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly code: string | null =
    this.route.snapshot.paramMap.get('code') ?? this.route.snapshot.queryParamMap.get('code');

  readonly tournament = signal<PublicTournament | null>(null);
  readonly notFound = signal(false);
  readonly bracketResult = signal<{ bracket: Bracket; pairs: Pair[] } | null>(null);
  readonly bracketNotGenerated = signal(false);
  readonly loading = signal(!!this.code);

  readonly hasClassification = computed(
    () => (this.bracketResult()?.bracket.classification_brackets.length ?? 0) > 0,
  );

  private readonly publicTournamentService = inject(PublicTournamentService);

  constructor() {
    if (!this.code) {
      this.notFound.set(true);
      return;
    }

    const updatesService = inject(PublicTournamentUpdatesService);
    const destroyRef = inject(DestroyRef);

    this.fetchTournament(this.code);
    this.fetchBracket(this.code);

    updatesService.connect(this.code);
    destroyRef.onDestroy(() => updatesService.disconnect());

    merge(updatesService.onResource('tournament'), updatesService.reconnected$)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.fetchTournament(this.code!));

    merge(updatesService.onResource('bracket'), updatesService.reconnected$)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.fetchBracket(this.code!));
  }

  classificationTournament(status: TournamentStatus): { id: number; status: TournamentStatus } {
    return { id: 0, status };
  }

  private fetchTournament(code: string): void {
    this.publicTournamentService.getPublicTournament(code).subscribe({
      next: t => {
        this.tournament.set(t);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  private fetchBracket(code: string): void {
    this.publicTournamentService.getPublicBracket(code).subscribe({
      next: resp => this.bracketResult.set(mapPublicBracketResponse(resp)),
      error: () => this.bracketNotGenerated.set(true),
    });
  }
}
