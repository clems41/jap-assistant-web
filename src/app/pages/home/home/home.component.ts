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
import {Tournament, TournamentRequest, TournamentStatus} from '../../../shared/models/tournament.models';
import {EnumChoice} from '../../../shared/models/base.models';
import {TabsModule} from 'primeng/tabs';
import {TournamentListComponent} from './tournament-list/tournament-list.component';
import {startOfDay} from 'date-fns';
import {forkJoin} from 'rxjs';

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
  createLoading = signal(false);
  availableGenders: EnumChoice[] = [];
  availableCategories: EnumChoice[] = [];
  availableLeagues: EnumChoice[] = [];
  availableLocations: string[] = [];
  dataLoading = signal(false);
  private readonly today = startOfDay(new Date());
  minStartDateForUpcomingTournaments: Date = this.today;

  ngOnInit() {
    this.getData();
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

  private getData(): void {
    this.dataLoading.set(true);
    forkJoin({
      informations: this.tournamentService.getInformations(),
      categories: this.tournamentService.getCategories(),
      genders: this.tournamentService.getGenders(),
      leagues: this.tournamentService.getLeagues(),
    }).subscribe({
      next: ({informations, categories, genders, leagues}) => {
        this.createForm.patchValue({
          league: informations?.last_league,
          location: informations?.last_location
        });
        this.availableLocations = informations?.all_locations;
        this.availableCategories = categories;
        this.availableGenders = genders;
        this.availableLeagues = leagues;
        this.dataLoading.set(false);
      },
      error: () => {
        this.dataLoading.set(false);
      }
    });
  }

  showCreateDialog(): void {
    this.createForm.patchValue({start_date: new Date()});
    this.createDialogVisible = true;
  }

  createTournament(): void {
    if (this.createForm.invalid) return
    this.createLoading.set(true);
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
        this.createLoading.set(false);
        this.createDialogVisible = false;
        this.router.navigate([`/tournaments/setup/${response.id}`]).then();
      },
      error: () => {
        this.createLoading.set(false);
        this.createDialogVisible = false;
        this.createForm.reset();
      }
    })
  }

  protected readonly TournamentStatus = TournamentStatus;
}
