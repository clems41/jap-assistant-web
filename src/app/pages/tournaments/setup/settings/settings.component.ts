import {ChangeDetectionStrategy, Component, input, signal} from '@angular/core';
import {Tournament} from '../../../../shared/models/tournament.models';

@Component({
  selector: 'app-settings',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  tournament = input.required<Tournament>();

  loading = signal<boolean>(false);
  }
