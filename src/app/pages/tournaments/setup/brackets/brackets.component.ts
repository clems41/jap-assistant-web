import {Component, input} from '@angular/core';
import {Tournament} from '../../../../shared/models/tournament.models';
import {Pair} from '../../../../shared/models/pair.models';
import {TreeNode} from 'primeng/api';
import {OrganizationChartModule} from 'primeng/organizationchart';

@Component({
  selector: 'app-brackets',
  imports: [
    OrganizationChartModule,
  ],
  templateUrl: './brackets.component.html'
})
export class BracketsComponent {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  data: TreeNode[] = [
    {
      expanded: true,
      type: 'person',
      styleClass: '',
      data: {
        name: 'Amy Elsner',
        title: 'CEO',
      },
      children: [
        {
          expanded: true,
          type: 'person',
          styleClass: '',
          data: {
            name: 'Anna Fali',
            title: 'CMO',
          },
          children: [
            {
              label: 'Sales',
              styleClass: '',
            },
            {
              label: 'Marketing',
              styleClass: '',
            },
          ],
        },
        {
          expanded: true,
          type: 'person',
          styleClass: '',
          data: {
            name: 'Stephen Shaw',
            title: 'CTO',
          },
          children: [
            {
              label: 'Development',
              styleClass: '',
            },
            {
              label: 'UI/UX Design',
              styleClass: '',
            },
          ],
        },
      ],
    },
  ];
}
