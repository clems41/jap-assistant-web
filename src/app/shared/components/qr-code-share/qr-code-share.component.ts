import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code-share',
  imports: [
    ClipboardModule,
    ButtonModule,
  ],
  templateUrl: './qr-code-share.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCodeShareComponent {
  private readonly messageService = inject(MessageService);

  url = input.required<string>();

  qrCodeDataUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      const url = this.url();
      QRCode.toDataURL(url, {
        width: 224,
        margin: 1,
        color: { dark: '#1b3f6e', light: '#ffffff' },
      }).then(dataUrl => this.qrCodeDataUrl.set(dataUrl)).catch(() => this.qrCodeDataUrl.set(null));
    });
  }

  onCopy(success: boolean): void {
    this.messageService.add({
      key: 'global',
      severity: success ? 'success' : 'error',
      summary: success ? 'Succès' : 'Erreur',
      detail: success ? 'Le lien a bien été copié dans le presse-papiers.' : 'La copie du lien a échoué. Veuillez le sélectionner manuellement.',
      life: 5000,
    });
  }
}
