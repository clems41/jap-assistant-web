import {ChangeDetectionStrategy, Component, effect, inject, input, signal} from '@angular/core';
import {TimeSlot, TimeSlotRequest, Tournament} from '../../../../../shared/models/tournament.models';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TournamentService} from '../../../../../shared/services/tournament.service';
import {DatePickerModule} from 'primeng/datepicker';
import {InputNumberModule} from 'primeng/inputnumber';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';

@Component({
  selector: 'app-time-slots',
  imports: [
    ReactiveFormsModule,
    DatePickerModule,
    InputNumberModule,
    ButtonModule,
    TooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './time-slots.component.html'
})
export class TimeSlotsComponent {
  tournament = input.required<Tournament>();
  private readonly formBuilder = inject(FormBuilder);
  private readonly tournamentService = inject(TournamentService);
  timeSlotForm: FormGroup = this.buildForm();
  timeSlots = signal<TimeSlot[]>([]);
  loading = signal<boolean>(false);
  editingId = signal<number | null>(null);
  editForm: FormGroup = this.buildForm();

  constructor() {
    effect(() => {
      this.loading.set(true);
      const tournament = this.tournament();
      this.refreshTimeSlots(tournament);
    });
    effect(() => {
      const slots = this.timeSlots();
      const lastEndTime = slots.length > 0 ? slots[slots.length - 1].end_time : '12:00';
      const date = this.parseTimeToDate(lastEndTime);
      this.timeSlotForm.patchValue({ start_time: date, end_time: date });
    });

    this.timeSlotForm.get('start_time')!.valueChanges.subscribe((value: Date | null) => {
      if (value) {
        this.timeSlotForm.patchValue({ end_time: value }, { emitEvent: false });
      }
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
    });
  }

  addTimeSlot(): void {
    if (this.timeSlotForm.invalid) return;
    const { start_time, end_time, courts_available } = this.timeSlotForm.value;
    const request: TimeSlotRequest = {
      courts_available: courts_available,
      end_time: this.getTimeSlotTimeFormat(end_time),
      start_time: this.getTimeSlotTimeFormat(start_time)
    };
    this.loading.set(true);
    const tournament = this.tournament();
    this.tournamentService.addTimeSlot(tournament.id, request).subscribe({
      next: () => {
        this.timeSlotForm.reset();
        this.refreshTimeSlots(tournament);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  startEdit(timeSlot: TimeSlot): void {
    this.editingId.set(timeSlot.id);
    this.editForm.setValue({
      start_time: this.parseTimeToDate(timeSlot.start_time),
      end_time: this.parseTimeToDate(timeSlot.end_time),
      courts_available: timeSlot.courts_available,
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editForm.reset();
  }

  confirmEdit(timeSlot: TimeSlot): void {
    if (this.editForm.invalid) return;
    const { start_time, end_time, courts_available } = this.editForm.value;
    const request: TimeSlotRequest = {
      courts_available: courts_available,
      end_time: this.getTimeSlotTimeFormat(end_time),
      start_time: this.getTimeSlotTimeFormat(start_time)
    };
    this.loading.set(true);
    const tournament = this.tournament();
    this.tournamentService.updateTimeSlot(tournament.id, timeSlot.id, request).subscribe({
      next: () => {
        this.editingId.set(null);
        this.editForm.reset();
        this.refreshTimeSlots(tournament);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  deleteTimeSlot(timeSlot: TimeSlot): void {
    this.loading.set(true);
    const tournament = this.tournament();
    this.tournamentService.deleteTimeSlot(tournament.id, timeSlot.id).subscribe({
      next: () => {
        this.refreshTimeSlots(tournament);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${(minutes ?? '0').padStart(2, '0')}`;
  }

  private parseTimeToDate(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private getTimeSlotTimeFormat(time: Date): string {
    return `${time.getHours()}:${time.getMinutes()}`;
  }
}
