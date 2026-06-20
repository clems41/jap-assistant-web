import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ClassificationBracket, Tournament } from '../../../../../shared/models/tournament.models';
import { Pair } from '../../../../../shared/models/pair.models';
import { BracketChartComponent } from '../../brackets/bracket-chart/bracket-chart.component';

@Component({
  selector: 'app-classification-bracket-node',
  standalone: true,
  imports: [
    BracketChartComponent,
  ],
  templateUrl: './classification-bracket-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationBracketNodeComponent {
  classificationBracket = input.required<ClassificationBracket>();
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();

  scoreChanged = output<{ matchId: number; score: string; winnerId: number }>();
  scoreDeleteRequested = output<number>();
}
