import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';

export interface PairPickerOption {
  id: number;
  label: string;
  badge: { rank: number; severity: string } | null;
}

@Component({
  selector: 'app-pair-picker-dialog',
  standalone: true,
  imports: [
    DialogModule,
    TagModule,
  ],
  templateUrl: './pair-picker-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PairPickerDialogComponent {
  pairs = input.required<PairPickerOption[] | null>();
  slotLabel = input<string>('');

  pairSelected = output<number>();
  closed = output<void>();

  selectPair(pairId: number): void {
    this.pairSelected.emit(pairId);
  }

  close(): void {
    this.closed.emit();
  }
}
