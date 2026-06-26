import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { PublicPair } from '../../../shared/models/public-tournament.models';
import { PublicTournamentService } from '../../../shared/services/public-tournament.service';
import { PublicTournamentUpdatesService } from '../../../shared/services/public-tournament-updates.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-public-tournament-players',
  standalone: true,
  imports: [
    LoadingSpinnerComponent,
  ],
  templateUrl: './public-tournament-players.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicTournamentPlayersComponent {
  code = input.required<string>();

  private readonly publicTournamentService = inject(PublicTournamentService);
  private readonly updatesService = inject(PublicTournamentUpdatesService);

  readonly pairs = signal<PublicPair[]>([]);
  readonly loading = signal(false);

  constructor() {
    effect(() => {
      const code = this.code();
      untracked(() => {
        this.fetchPairs(code);
      });
    });

    merge(this.updatesService.onResource('pairs'), this.updatesService.reconnected$)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.fetchPairs(this.code()));
  }

  private fetchPairs(code: string): void {
    this.loading.set(true);
    this.publicTournamentService.getPublicPairs(code).subscribe({
      next: pairs => {
        this.pairs.set([...pairs].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
