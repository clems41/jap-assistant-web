import {Component, inject, OnInit} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {Tournament, TournamentService} from '../../../shared/services/tournament.service';
import {PaginatorModule, PaginatorState} from 'primeng/paginator';

@Component({
  selector: 'app-home',
  imports: [
    ButtonModule,
    PaginatorModule
  ],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  tournaments: Tournament[] = [];
  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;

  ngOnInit() {
    this.refreshItems();
  }

  private refreshItems(): void {
    this.tournamentService.getTournaments(this.first * this.rows)
      .subscribe(response => {
        this.totalRecords = response.count
        this.tournaments = response.results;
      });
  }

  onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
    this.refreshItems();
  }


}
