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
import {NgClass, NgTemplateOutlet} from '@angular/common';
import {ConfirmationService} from 'primeng/api';
import {InputNumberModule} from 'primeng/inputnumber';
import {FileUploadHandlerEvent, FileUploadModule} from 'primeng/fileupload';

@Component({
  selector: 'app-players',
  imports: [
    LoadingSpinnerComponent,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ReactiveFormsModule,
    FieldErrorComponent,
    InputMaskModule,
    NgClass,
    NgTemplateOutlet,
    InputNumberModule,
    FileUploadModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './players.component.html'
})
export class PlayersComponent {
  tournament = input.required<Tournament>();
  private readonly pairService = inject(PairService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  pairs = signal<Pair[]>([]);
  loading = signal<boolean>(false);
  importPairsDialogVisible: boolean = false;
  addPairForm: FormGroup = this.buildAddPairForm();
  editPairForm: FormGroup = this.buildEditPairForm();
  addPairDialogVisible: boolean = false;
  editPairDialogVisible: boolean = false;

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
        this.pairs.set(result.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)));
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

  private buildEditPairForm(): FormGroup {
    return this.formBuilder.group({
      pair_id: [null, Validators.required],
      player1_first_name: ['', Validators.required],
      player1_last_name: ['', Validators.required],
      player1_license_number: ['', [Validators.required, isLicenseNumber]],
      player1_phone_number: ['', []],
      player1_ranking: [null, [Validators.required, Validators.min(1)]],
      player2_first_name: ['', Validators.required],
      player2_last_name: ['', Validators.required],
      player2_license_number: ['', [Validators.required, isLicenseNumber]],
      player2_phone_number: ['', []],
      player2_ranking: [null, [Validators.required, Validators.min(1)]],
    })
  }

  pairDataIsComplete(pair: Pair): boolean {
    return pair.weight !== null;
  }

  showImportPairsDialog(): void {
    this.importPairsDialogVisible = true;
  }

  downloadExampleCsv(): void {
    const link = document.createElement('a');
    link.href = 'assets/example-paires.csv';
    link.download = 'example-paires.csv';
    link.click();
  }

  showAddPairDialog(): void {
    this.addPairDialogVisible = true;
  }

  closeAddPairDialog(): void {
    this.addPairDialogVisible = false;
  }

  showEditPairDialog(pair: Pair): void {
    this.editPairDialogVisible = true;
    this.editPairForm.patchValue({
      pair_id: pair.id,
      player1_first_name: pair.player1.first_name,
      player1_last_name: pair.player1.last_name,
      player1_license_number: pair.player1.license_number,
      player1_phone_number: pair.player1.phone,
      player1_ranking: pair.player1.ranking,
      player2_first_name: pair.player2.first_name,
      player2_last_name: pair.player2.last_name,
      player2_license_number: pair.player2.license_number,
      player2_phone_number: pair.player2.phone,
      player2_ranking: pair.player2.ranking,
    });
  }

  closeEditPairDialog(): void {
    this.editPairDialogVisible = false;
    this.editPairForm.reset();
  }

  importPairs(event: FileUploadHandlerEvent): void {
    if (event.files.length === 0) return
    const file = event.files[0];
    this.loading.set(true);
    const tournament = this.tournament();
    this.pairService.importPairs(tournament.id, file).subscribe({
      next: () => {
        this.refreshPairs(tournament);
        this.importPairsDialogVisible = false;
      },
      error: () => {
        this.loading.set(false);
        this.importPairsDialogVisible = false;
      }
    })
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

  editPair(): void {
    if (this.editPairForm.invalid) return
    const {pair_id, player1_first_name, player1_last_name, player1_license_number, player1_phone_number, player1_ranking,
      player2_first_name, player2_last_name, player2_license_number, player2_phone_number, player2_ranking} = this.editPairForm.value;
    const input: PairRequest = {
      player1: {
        first_name: player1_first_name,
        last_name: player1_last_name,
        phone: player1_phone_number,
        license_number: player1_license_number,
        ranking: player1_ranking
      },
      player2: {
        first_name: player2_first_name,
        last_name: player2_last_name,
        phone: player2_phone_number,
        license_number: player2_license_number,
        ranking: player2_ranking
      }
    };
    this.editPairDialogVisible = false;
    this.loading.set(true);
    const tournament = this.tournament();
    this.pairService.updatePair(tournament.id, pair_id, input).subscribe({
      next: () => this.refreshPairs(tournament),
      error: () => {
        this.loading.set(false);
      }
    })
  }

  matchRanking(): void {
    this.loading.set(true);
    const tournament = this.tournament();
    this.pairService.matchRanking(tournament.id).subscribe({
      next: response => {
        this.pairs.set(response.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    })
  }

  deletePair(pair: Pair, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Êtes-vous sûr de vouloir supprimer la paire '${pair.player1.last_name} / ${pair.player2.last_name}' ?`,
      header: 'Confirmation',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Annuler',
        severity: 'danger',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Supprimer',
        severity: 'danger',
      },
      accept: () => {
        this.loading.set(true);
        const tournament = this.tournament();
        this.pairService.deletePair(tournament.id, pair.id).subscribe({
          next: () => this.refreshPairs(tournament),
          error: () => {
            this.loading.set(false);
          }
        })
      },
    });
  }
}
