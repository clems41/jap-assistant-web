import {Component, effect, inject, input, signal} from '@angular/core';
import {TimeSlot, TimeSlotRequest, Tournament} from '../../../../../shared/models/tournament.models';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TournamentService} from '../../../../../shared/services/tournament.service';

@Component({
  selector: 'app-time-slots',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './time-slots.component.html'
})
export class TimeSlotsComponent {
  tournament = input.required<Tournament>();
  private readonly formBuilder = inject(FormBuilder);
  private readonly tournamentService = inject(TournamentService);
  timeSlotForm: FormGroup = this.buildForm();
  timeSlots = signal<TimeSlot[]>([]);

  loading = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.loading.set(true);
      const tournament = this.tournament();
      this.refreshTimeSlots(tournament);
    });
  }

  private refreshTimeSlots(tournament: Tournament): void {
    this.tournamentService.getTimeSlots(tournament.id).subscribe({
      next: result => {
        this.loading.set(false);
        this.timeSlots.set(result);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      start_time: [null, [Validators.required]],
      end_time: [null, [Validators.required]],
      courts_available: [null, [Validators.required, Validators.min(1)]],
    })
  }

  addTimeSlot(): void {
    if (this.timeSlotForm.invalid) return
    const { start_time, end_time, courts_available } = this.timeSlotForm.value;
    const input: TimeSlotRequest = {
      courts_available: courts_available,
      end_time: end_time,
      start_time: start_time
    }
    this.loading.set(true);
    const tournament = this.tournament();
    this.tournamentService.addTimeSlot(tournament.id, input).subscribe({
      next: () => {
        this.refreshTimeSlots(tournament);
      },
      error: () => {
        this.loading.set(false);
      }
    })
  }

}
