import {Component, inject, input} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {TournamentService} from '../../../../shared/services/tournament.service';
import {ConfirmationService} from 'primeng/api';
import {Router} from '@angular/router';
import {Tournament} from '../../../../shared/models/tournament.models';
import {Pair} from '../../../../shared/models/pair.models';

@Component({
  selector: 'app-brackets',
  imports: [],
  templateUrl: './brackets.component.html'
})
export class BracketsComponent {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  private readonly formBuilder = inject(FormBuilder);
  private readonly tournamentService = inject(TournamentService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

}
