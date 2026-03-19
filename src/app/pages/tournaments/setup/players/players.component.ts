import {ChangeDetectionStrategy, Component, effect, inject, input, signal} from '@angular/core';
import {Tournament} from '../../../../shared/models/tournament.models';
import {PairService} from '../../../../shared/services/pair.service';
import {Pair, PairRequest} from '../../../../shared/models/pair.models';
import {LoadingSpinnerComponent} from '../../../../shared/components/loading-spinner/loading-spinner.component';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {FieldErrorComponent} from '../../../../shared/components/field-error/field-error.component';
import {isLicenseNumber} from '../../../../shared/validators/form.validators';
import {InputMaskModule} from 'primeng/inputmask';

@Component({
  selector: 'app-players',
  imports: [
    LoadingSpinnerComponent,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ReactiveFormsModule,
    FieldErrorComponent,
    InputMaskModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './players.component.html'
})
export class PlayersComponent {
  tournament = input.required<Tournament>();
  private readonly pairService = inject(PairService);
  private readonly formBuilder = inject(FormBuilder);
  pairs = signal<Pair[]>([]);
  loading = signal<boolean>(false);
  addPairForm: FormGroup = this.buildAddPairForm();
  addPairDialogVisible: boolean = false;

  constructor() {
    effect(() => {
      this.loading.set(true);
      const tournament = this.tournament();
      this.refreshPairs(tournament);
    });
  }

  private refreshPairs(tournament: Tournament): void {
    this.pairService.getPairs(tournament.id).subscribe({
      next: result => {
        this.loading.set(false);
        this.pairs.set(result);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private buildAddPairForm(): FormGroup {
    return this.formBuilder.group({
      player1_first_name: ['', Validators.required],
      player1_last_name: ['', Validators.required],
      player1_license_number: ['', [Validators.required, isLicenseNumber]],
      player1_phone_number: ['', []],
      player2_first_name: ['', Validators.required],
      player2_last_name: ['', Validators.required],
      player2_license_number: ['', [Validators.required, isLicenseNumber]],
      player2_phone_number: ['', []],
    })
  }

  showAddPairDialog(): void {
    this.addPairDialogVisible = true;
  }

  addPair(): void {
    if (this.addPairForm.invalid) return
    const {player1_first_name, player1_last_name, player1_license_number, player1_phone_number,
      player2_first_name, player2_last_name, player2_license_number, player2_phone_number} = this.addPairForm.value;
    const input: PairRequest = {
      player1: {
        first_name: player1_first_name,
        last_name: player1_last_name,
        phone: player1_phone_number,
        license_number: player1_license_number
      },
      player2: {
        first_name: player2_first_name,
        last_name: player2_last_name,
        phone: player2_phone_number,
        license_number: player2_license_number
      }
    };
    this.addPairDialogVisible = false;
    this.loading.set(true);
    const tournament = this.tournament();
    this.pairService.createPair(tournament.id, input).subscribe({
      next: () => this.refreshPairs(tournament),
      error: () => {
        this.loading.set(false);
      }
    })
  }
}
