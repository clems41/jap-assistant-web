import {Component, effect, inject, input, signal, untracked} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {TournamentService} from '../../../../shared/services/tournament.service';
import {PaginatedTournamentRequest, Tournament, TournamentStatus} from '../../../../shared/models/tournament.models';
import {toFrenchDate, toISODate} from '../../../../shared/utils/date.utils';
import {nbFiltersApplied} from '../../../../shared/utils/data.utils';
import {PaginatorModule, PaginatorState} from 'primeng/paginator';
import {ButtonModule} from 'primeng/button';
import {DatePickerModule} from 'primeng/datepicker';
import {DialogModule} from 'primeng/dialog';
import {LoadingSpinnerComponent} from '../../../../shared/components/loading-spinner/loading-spinner.component';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {RouterLink} from '@angular/router';
import {EnumChoice} from '../../../../shared/models/base.models';

@Component({
  selector: 'app-tournament-list',
  imports: [
    ButtonModule,
    DatePickerModule,
    DialogModule,
    LoadingSpinnerComponent,
    PaginatorModule,
    ReactiveFormsModule,
    SelectModule,
    TagModule,
    RouterLink
  ],
  templateUrl: './tournament-list.component.html'
})
export class TournamentListComponent {
  status = input<TournamentStatus[]>();
  startDate = input<Date>();
  minStartDate = input<Date>();
  maxStartDate = input<Date>();
  endDate = input<Date>();
  minEndDate = input<Date>();
  maxEndDate = input<Date>();
  availableGenders = input.required<EnumChoice[]>();
  availableCategories = input.required<EnumChoice[]>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly tournamentService = inject(TournamentService);

  constructor() {
    effect(() => {
      const startDate = this.startDate();
      const endDate = this.endDate();
      this.filterForm.patchValue({start_date: startDate, end_date: endDate});
      untracked(() => this.refreshItems());
    });
  }
  tournaments: Tournament[] = [];
  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;
  loading = signal(false);
  filterDialogVisible: boolean = false;
  filterForm: FormGroup = this.buildFilterForm();
  nbFilters: string = '0';

  private buildFilterForm(): FormGroup {
    return this.formBuilder.group({
      category: [null, []],
      gender: [null, []],
      start_date: [null, []],
      end_date: [null, []],
    })
  }

  private refreshItems(): void {
    this.loading.set(true);
    const {category, gender, start_date, end_date} = this.filterForm.value;
    const page = this.first / this.rows + 1;
    const filters: PaginatedTournamentRequest = {
      ordering: 'start_date',
      page: page,
      page_size: this.rows,
      category: category,
      start_date: start_date ? toISODate(start_date) : undefined,
      end_date: end_date ? toISODate(end_date) : undefined,
      gender: gender,
      status: this.status(),
    }
    this.tournamentService.getTournaments(filters)
      .subscribe({
        next: response => {
          this.totalRecords = response.count
          this.tournaments = response.results;
          this.loading.set(false);
          this.filterDialogVisible = false;
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  filterTournaments(): void {
    this.nbFilters = nbFiltersApplied(this.filterForm.value).toString();
    this.refreshItems();
  }

  onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
    this.refreshItems();
  }

  showFilterDialog(): void {
    this.filterDialogVisible = true;
  }

  reinitialiserFiltres(): void {
    this.nbFilters = '0';
    this.filterForm.reset();
  }

  protected readonly toFrenchDate = toFrenchDate;
}
