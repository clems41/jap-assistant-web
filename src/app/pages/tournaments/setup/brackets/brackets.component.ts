import {Component, input} from '@angular/core';
import {Tournament} from '../../../../shared/models/tournament.models';
import {EnumChoice} from '../../../../shared/models/base.models';
import {Pair} from '../../../../shared/models/pair.models';

@Component({
  selector: 'app-brackets',
  imports: [],
  templateUrl: './brackets.component.html'
})
export class BracketsComponent {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  availableGameFormats = input.required<EnumChoice[]>();

}
