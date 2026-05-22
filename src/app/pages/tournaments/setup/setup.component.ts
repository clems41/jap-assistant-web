import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TournamentService} from '../../../shared/services/tournament.service';
import {Tournament} from '../../../shared/models/tournament.models';
import {TabsModule} from 'primeng/tabs';
import {InfosComponent} from './infos/infos.component';
import {PlayersComponent} from './players/players.component';
import {SettingsComponent} from './settings/settings.component';
import {toSignal} from '@angular/core/rxjs-interop';
import {NgIf} from '@angular/common';
import {BracketsComponent} from './brackets/brackets.component';
import {PairService} from '../../../shared/services/pair.service';
import {Pair} from '../../../shared/models/pair.models';

@Component({
  selector: 'app-setup',
  imports: [
    TabsModule,
    InfosComponent,
    PlayersComponent,
    SettingsComponent,
    NgIf,
    BracketsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './setup.component.html'
})
export class SetupComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  private readonly pairService = inject(PairService);

  readonly tournamentId: number = Number(this.route.snapshot.paramMap.get('id'));
  tournament = signal<Tournament | null>(null);
  pairs = signal<Pair[]>([]);
  loading = signal<boolean>(false);

  genders = toSignal(this.tournamentService.getGenders(), {initialValue: []});
  categories = toSignal(this.tournamentService.getCategories(), {initialValue: []});
  leagues = toSignal(this.tournamentService.getLeagues(), {initialValue: []});
  gameFormats = toSignal(this.tournamentService.getGameFormats(), {initialValue: []});

  ngOnInit() {
    this.loading.set(true);
    this.tournamentService.getTournament(this.tournamentId)
      .subscribe({
        next: t => {
          this.tournament.set(t);
          this.refreshPairs();
        },
        error: () => this.loading.set(false)
      });
  }

  refreshPairs(): void {
    const tournament = this.tournament();
    if (!tournament) return
    this.loading.set(true);
    this.pairService.getPairs(tournament.id).subscribe({
      next: result => {
        this.loading.set(false);
        this.pairs.set(result.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)));
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  get tournamentContainsBracket(): boolean {
    return ['TMC'].includes(this.tournament()?.configuration ?? '');
  }
}
