import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TournamentService} from '../../../shared/services/tournament.service';
import {Tournament} from '../../../shared/models/tournament.models';
import {TabsModule} from 'primeng/tabs';
import {InfosComponent} from './infos/infos.component';
import {PlayersComponent} from './players/players.component';
import {SettingsComponent} from './settings/settings.component';

@Component({
  selector: 'app-setup',
  imports: [
    TabsModule,
    InfosComponent,
    PlayersComponent,
    SettingsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './setup.component.html'
})
export class SetupComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);

  readonly tournamentId: number = Number(this.route.snapshot.paramMap.get('id'));
  tournament = signal<Tournament | null>(null);

  ngOnInit() {
    this.tournamentService.getTournament(this.tournamentId)
      .subscribe(t => this.tournament.set(t));
  }
}
