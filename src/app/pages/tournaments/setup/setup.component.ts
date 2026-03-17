import {Component, inject, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {Tournament, TournamentService} from '../../../shared/services/tournament.service';

@Component({
  selector: 'app-setup',
  imports: [],
  templateUrl: './setup.component.html'
})
export class SetupComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);

  readonly tournamentId: number = Number(this.route.snapshot.paramMap.get('id'));
  tournament: Tournament | undefined;

  ngOnInit() {
    this.tournamentService.getTournament(this.tournamentId)
      .subscribe(tournament => {this.tournament = tournament});
  }

}
