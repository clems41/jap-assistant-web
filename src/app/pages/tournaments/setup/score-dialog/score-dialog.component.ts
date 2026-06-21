import {ChangeDetectionStrategy, Component, effect, inject, input, output} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {RadioButtonModule} from 'primeng/radiobutton';

export interface ScoreDialogMatch {
  id: number;
  round_display: string;
  match_number: number;
  pair1: number | null;
  pair2: number | null;
  score: string;
  winner_id: number | null;
}

export interface ScoreSavedEvent {
  matchId: number;
  score: string;
  winnerId: number;
}

@Component({
  selector: 'app-score-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    RadioButtonModule,
  ],
  templateUrl: './score-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreDialogComponent {
  match = input.required<ScoreDialogMatch | null>();
  pair1Name = input<string>('');
  pair2Name = input<string>('');

  scoreSaved = output<ScoreSavedEvent>();
  closed = output<void>();

  private readonly fb = inject(FormBuilder);

  scoreForm = this.fb.group({
    score: ['', Validators.required],
    winnerId: [null as number | null, Validators.required],
  });

  constructor() {
    effect(() => {
      const match = this.match();
      if (match) {
        this.scoreForm.reset({
          score: match.score || '',
          winnerId: match.winner_id || null,
        });
      }
    });
  }

  save(): void {
    if (this.scoreForm.invalid) return;
    const match = this.match();
    if (!match) return;
    const {score, winnerId} = this.scoreForm.value;
    this.scoreSaved.emit({matchId: match.id, score: score!, winnerId: winnerId!});
  }

  close(): void {
    this.closed.emit();
  }
}
