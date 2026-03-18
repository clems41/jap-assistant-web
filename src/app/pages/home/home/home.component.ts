import {Component, inject, OnInit, signal} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {
  TournamentService
} from '../../../shared/services/tournament.service';
import {PaginatorModule, PaginatorState} from 'primeng/paginator';
import {DialogModule} from 'primeng/dialog';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {toFrenchDate, toISODate} from '../../../shared/utils/date.utils';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {DatePickerModule} from 'primeng/datepicker';
import {TagModule} from 'primeng/tag';
import {PaginatedTournamentRequest, Tournament, TournamentRequest} from '../../../shared/models/tournament.models';
import {EnumChoice} from '../../../shared/models/base.models';

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
    RouterLink,
    TagModule
  ],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly tournamentService = inject(TournamentService);
  private readonly router = inject(Router);
  tournaments: Tournament[] = [];
  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;
  createDialogVisible: boolean = false;
  createForm: FormGroup = this.buildCreateForm();
  loading = signal(false);
  noRecords = signal(true);
  availableGenders: EnumChoice[] = [];
  availableCategories: EnumChoice[] = [];
  availableLeagues: EnumChoice[] = [];
  minDate: Date = new Date();
  filterDialogVisible: boolean = false;
  filterForm: FormGroup = this.buildFilterForm();

  ngOnInit() {
    this.refreshItems(true);
    this.getLastLeagueValue();
    this.getEnumData();
  }

  private buildCreateForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required]],
      category: [null, [Validators.required]],
      start_date: [null, [Validators.required]],
      location: [null, [Validators.required]],
      league: [null, [Validators.required]],
      gender: [null, [Validators.required]],
    })
  }

  private buildFilterForm(): FormGroup {
    return this.formBuilder.group({
      category: [null, []],
      gender: [null, []],
      start_date: [null, []],
      end_date: [null, []],
    })
  }

  private getLastLeagueValue(): void {
    this.tournamentService.getLastLeague().subscribe(res => {
      this.createForm.patchValue({
        league: res?.league
      })
    });
  }

  private refreshItems(init: boolean = false): void {
    this.loading.set(true);
    const {category, gender, start_date, end_date} = this.filterForm.value;
    const page = this.first / this.rows + 1;
    const filters: PaginatedTournamentRequest = {
      page: page,
      category: category,
      start_date: start_date ? toISODate(start_date) : undefined,
      end_date: end_date ? toISODate(end_date) : undefined,
      gender: gender,
    }
    this.tournamentService.getTournaments(filters)
      .subscribe({
        next: response => {
          this.totalRecords = response.count
          this.tournaments = response.results;
          if (init) this.noRecords.set(response.count === 0);
          this.loading.set(false);
          this.filterDialogVisible = false;
        },
        error: () => {
          this.loading.set(false);
        }
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

  filterTournaments(): void {
    this.refreshItems();
  }

  onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
    this.refreshItems();
  }

  showCreateDialog(): void {
    this.createDialogVisible = true;
  }

  showFilterDialog(): void {
    this.filterDialogVisible = true;
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

  reinitialiserFiltres(): void {
    this.filterForm.reset();
  }

  protected readonly toFrenchDate = toFrenchDate;
}
