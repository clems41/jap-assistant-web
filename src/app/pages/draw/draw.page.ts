import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {SelectModule} from 'primeng/select';
import {ButtonModule} from 'primeng/button';
import {FormsModule} from '@angular/forms';
import {NgTemplateOutlet} from '@angular/common';

interface Chip {
  position: number;
  value: number;
  revealed: boolean;
}

@Component({
  selector: 'app-draw',
  imports: [
    SelectModule,
    ButtonModule,
    FormsModule,
    NgTemplateOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './draw.page.html'
})
export class DrawPageComponent {
  readonly availableCounts = Array.from({length: 15}, (_, i) => i + 2);
  readonly edgeAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  selectedCount = signal<number | null>(null);
  chips = signal<Chip[]>([]);

  onCountChange(n: number): void {
    this.selectedCount.set(n);
    this.shuffle(n);
  }

  refresh(): void {
    const n = this.selectedCount();
    if (n !== null) this.shuffle(n);
  }

  reveal(position: number): void {
    this.chips.update(chips =>
      chips.map(c => c.position === position ? {...c, revealed: true} : c));
  }

  private shuffle(n: number): void {
    const values = Array.from({length: n}, (_, i) => i + 1);
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    this.chips.set(values.map((value, idx) => ({position: idx + 1, value, revealed: false})));
  }
}
