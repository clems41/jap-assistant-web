import {ChangeDetectionStrategy, Component, model} from '@angular/core';
import {Tournament} from '../../../../shared/models/tournament.models';

@Component({
  selector: 'app-settings',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  tournament = model.required<Tournament>();
  loading = model.required<boolean>();

}
