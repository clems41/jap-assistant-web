import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {
  TournamentService
} from '../../../shared/services/tournament.service';
import {PaginatorModule} from 'primeng/paginator';
import {DialogModule} from 'primeng/dialog';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {toISODate} from '../../../shared/utils/date.utils';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {DatePickerModule} from 'primeng/datepicker';
import {TagModule} from 'primeng/tag';
import {Tournament, TournamentRequest} from '../../../shared/models/tournament.models';
import {EnumChoice} from '../../../shared/models/base.models';
import {TabsModule} from 'primeng/tabs';
import {TournamentListComponent} from './tournament-list/tournament-list.component';
import {addMonths} from 'date-fns';

@Component({
  selector: 'app-home',
  imports: [
    ButtonModule,
    PaginatorModule,
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    TagModule,
    TabsModule,
    TournamentListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly tournamentService = inject(TournamentService);
  private readonly router = inject(Router);
  tournaments: Tournament[] = [];
  createDialogVisible: boolean = false;
  createForm: FormGroup = this.buildCreateForm();
  loading = signal(false);
  availableGenders: EnumChoice[] = [];
  availableCategories: EnumChoice[] = [];
  availableLeagues: EnumChoice[] = [];
  startDateForUpcomingTournaments: Date = new Date();
  endDateForUpcomingTournaments: Date = addMonths(new Date(), 3);
  minStartDateForUpcomingTournaments: Date = new Date();
  minEndDateForUpcomingTournaments: Date = new Date();
  startDateForPastTournaments: Date = addMonths(new Date(), -3);
  endDateForPastTournaments: Date = new Date();
  maxStartDateForPastTournaments: Date = new Date();
  maxEndDateForPastTournaments: Date = new Date();

  ngOnInit() {
    this.getLastLeagueValue();
    this.getEnumData();
  }

  private buildCreateForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required]],
      category: [null, [Validators.required]],
      start_date: [new Date(), [Validators.required]],
      location: [null, [Validators.required]],
      league: [null, [Validators.required]],
      gender: [null, [Validators.required]],
    })
  }

  private getLastLeagueValue(): void {
    this.tournamentService.getLastInformations().subscribe(res => {
      this.createForm.patchValue({
        league: res?.league,
        location: res?.location
      })
    });
  }

  private getEnumData(): void {
    this.tournamentService.getCategories().subscribe(res => {
      this.availableCategories = res
    });
    this.tournamentService.getGenders().subscribe(res => {
      this.availableGenders = res
    });
    this.tournamentService.getLeagues().subscribe(res => {
      this.availableLeagues = res
    });
  }

  showCreateDialog(): void {
    this.createForm.patchValue({start_date: new Date()});
    this.createDialogVisible = true;
  }

  createTournament(): void {
    if (this.createForm.invalid) return
    this.loading.set(true);
    const {name, category, start_date, location, league, gender} = this.createForm.value;
    const input: TournamentRequest = {
      name: name,
      category: category,
      start_date: toISODate(start_date),
      location: location,
      league: league,
      gender: gender
    };
    this.tournamentService.createTournament(input).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.createDialogVisible = false;
        this.router.navigate([`/tournaments/setup/${response.id}`]).then();
      },
      error: () => {
        this.loading.set(false);
        this.createDialogVisible = false;
        this.createForm.reset();
      }
    })
  }
}
