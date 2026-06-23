import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { Bracket, TournamentStatus } from '../../shared/models/tournament.models';
import { Pair } from '../../shared/models/pair.models';
import { PublicTournament } from '../../shared/models/public-tournament.models';
import { PublicTournamentService } from '../../shared/services/public-tournament.service';
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

  constructor() {
    if (!this.code) {
      this.notFound.set(true);
      return;
    }

    const publicTournamentService = inject(PublicTournamentService);

    publicTournamentService.getPublicTournament(this.code).subscribe({
      next: t => {
        this.tournament.set(t);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });

    publicTournamentService.getPublicBracket(this.code).subscribe({
      next: resp => this.bracketResult.set(mapPublicBracketResponse(resp)),
      error: () => this.bracketNotGenerated.set(true),
    });
  }

  classificationTournament(status: TournamentStatus): { id: number; status: TournamentStatus } {
    return { id: 0, status };
  }
}
