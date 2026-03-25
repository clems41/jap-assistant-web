import {
  Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild,
  ChangeDetectionStrategy, effect
} from '@angular/core';
import {Tournament} from '../../../../shared/models/tournament.models';
import {Pair} from '../../../../shared/models/pair.models';
import {TreeNode} from 'primeng/api';
import {OrganizationChartModule} from 'primeng/organizationchart';
import {BracketService} from '../../../../shared/services/bracket.service';
import {BracketDimension} from '../../../../shared/models/bracket.models';

@Component({
  selector: 'app-brackets',
  imports: [
    OrganizationChartModule,
  ],
  templateUrl: './brackets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BracketsComponent {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();

  private destroyRef = inject(DestroyRef);
  private bracketService = inject(BracketService);
  bracketDimension = signal<BracketDimension>(8);
  bracketData = signal<TreeNode[]>([]);

  chartContainer = viewChild<ElementRef<HTMLElement>>('chartContainer');
  private chartNaturalWidth = signal(0);
  private chartNaturalHeight = signal(0);
  chartMargin = computed(() => Math.max(0, (this.chartNaturalWidth() - this.chartNaturalHeight()) / 2));
  containerHeight = computed(() => this.chartNaturalWidth() || 400);

  constructor() {
    afterNextRender(() => {
      const el = this.chartContainer()?.nativeElement;
      if (!el) return;
      const observer = new ResizeObserver(() => {
        this.chartNaturalWidth.set(el.offsetWidth);
        this.chartNaturalHeight.set(el.offsetHeight);
      });
      observer.observe(el);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    effect(() => {
      this.bracketDimension.set(this.bracketService.getBracketDimensionFromNumberOfPairs(this.pairs().length));
      this.bracketData.set(this.bracketService.buildBracketData(this.bracketDimension()));
    });
  }
}
