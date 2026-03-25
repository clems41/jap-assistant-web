import {
  Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild,
  ChangeDetectionStrategy, effect, untracked
} from '@angular/core';
import {Tournament} from '../../../../shared/models/tournament.models';
import {Pair} from '../../../../shared/models/pair.models';
import {TreeNode} from 'primeng/api';
import {OrganizationChartModule} from 'primeng/organizationchart';
import {BracketService} from '../../../../shared/services/bracket.service';
import {SelectModule} from 'primeng/select';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-brackets',
  imports: [
    OrganizationChartModule,
    SelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './brackets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BracketsComponent {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();

  private destroyRef = inject(DestroyRef);
  private bracketService = inject(BracketService);
  private formBuilder = inject(FormBuilder);
  form: FormGroup = this.buildForm();
  bracketData = signal<TreeNode[]>([]);
  availableNumberOfTopSeeds = signal<number[]>([]);

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

    this.form.get('bracketDimension')?.valueChanges.subscribe(bracketDimension => this.bracketData.set(this.bracketService.buildBracketData(bracketDimension)));

    effect(() => {
      const nbPairs = this.pairs().length;
      const bracketDimension = this.bracketService.getBracketDimensionFromNumberOfPairs(nbPairs);
      untracked(() => {
        this.form.patchValue({
          bracketDimension: bracketDimension,
          nbTopSeeds: bracketDimension / 4,
        });
      });
      this.availableNumberOfTopSeeds.set(this.bracketService.getAvailableNumberOfTopSeedsFromNumberOfPairs(nbPairs));
      this.bracketData.set(this.bracketService.buildBracketData(bracketDimension));
    });
  }

  private buildForm() {
    return this.formBuilder.group({
      bracketDimension: [64, [Validators.required]],
      nbTopSeeds: [0, [Validators.required, Validators.min(1)]],
    })
  }
}
