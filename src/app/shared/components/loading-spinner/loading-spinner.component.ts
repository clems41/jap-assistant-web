import {Component, input} from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  imports: [],
  templateUrl: './loading-spinner.component.html'
})
export class LoadingSpinnerComponent {
  readonly loading = input.required<boolean>();
  readonly size = input<string>('4rem');
}
