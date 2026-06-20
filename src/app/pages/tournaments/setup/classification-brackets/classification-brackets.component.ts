import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { Bracket, ScoreRequest, Tournament } from '../../../../shared/models/tournament.models';
import { Pair } from '../../../../shared/models/pair.models';
import { TournamentService } from '../../../../shared/services/tournament.service';
import { PrintService } from '../../../../shared/services/print.service';
import { ClassificationBracketNodeComponent } from './classification-bracket-node/classification-bracket-node.component';

@Component({
  selector: 'app-classification-brackets',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Select,
    ButtonModule,
    ClassificationBracketNodeComponent,
  ],
  templateUrl: './classification-brackets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationBracketsComponent {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  bracket = input.required<Bracket>();

  // Le tableau principal (onglet "Tableau principal") conserve sa propre copie du bracket et
  // n'est pas resynchronisé par les mises à jour de score faites depuis cet onglet : sans impact
  // aujourd'hui car les deux arbres sont disjoints.
  bracketChange = output<Bracket>();

  private readonly tournamentService = inject(TournamentService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly printService = inject(PrintService);
  private readonly injector = inject(Injector);

  private readonly printArea = viewChild<ElementRef<HTMLElement>>('printArea');
  readonly printingAll = signal(false);

  readonly selectedBracketIdControl = new FormControl<number | null>(null);
  private readonly selectedBracketId = toSignal(this.selectedBracketIdControl.valueChanges, { initialValue: null });

  readonly classificationBrackets = computed(() => this.bracket().classification_brackets ?? []);

  readonly selectOptions = computed(() =>
    this.classificationBrackets().map(cb => ({
      label: `Places ${cb.start_place} à ${cb.end_place} — ${cb.source_round_display}`,
      value: cb.id,
    }))
  );

  readonly selectedBracket = computed(() =>
    this.classificationBrackets().find(cb => cb.id === this.selectedBracketId()) ?? null
  );

  constructor() {
    effect(() => {
      const list = this.classificationBrackets();
      untracked(() => {
        if (list.length && !list.some(cb => cb.id === this.selectedBracketIdControl.value)) {
          this.selectedBracketIdControl.setValue(list[0].id);
        }
      });
    });
  }

  onScoreChanged(event: { matchId: number; score: string; winnerId: number }): void {
    const req: ScoreRequest = { score: event.score, winner_id: event.winnerId };
    this.tournamentService
      .updateMatchScore(this.tournament().id, event.matchId, req)
      .subscribe({
        next: () => this.tournamentService.getTournamentBracket(this.tournament().id)
          .subscribe({ next: bracket => this.bracketChange.emit(bracket) }),
      });
  }

  onScoreDeleteRequested(matchId: number): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer le score de ce match ? Cette action est irréversible.',
      header: 'Supprimer le score',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Annuler', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Supprimer', severity: 'danger' },
      accept: () => {
        this.tournamentService.deleteMatchScore(this.tournament().id, matchId)
          .subscribe({
            next: () => this.tournamentService.getTournamentBracket(this.tournament().id)
              .subscribe({ next: bracket => this.bracketChange.emit(bracket) }),
          });
      },
    });
  }

  printAll(): void {
    this.printingAll.set(true);
    afterNextRender(() => {
      const el = this.printArea()?.nativeElement;
      if (el) this.printService.printElement(el, () => this.printingAll.set(false));
    }, { injector: this.injector });
  }
}
