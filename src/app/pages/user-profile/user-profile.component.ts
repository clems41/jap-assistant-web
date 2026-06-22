import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { AuthService, ChangePasswordRequest, UserProfile } from '../../shared/services/auth.service';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { passwordMatchValidator } from '../../shared/validators/form.validators';

@Component({
  selector: 'app-user-profile',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    PasswordModule,
    FieldErrorComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './user-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  passwordLoading = signal(false);

  form: FormGroup = this.buildForm();

  ngOnInit(): void {
    this.loading.set(true);
    this.authService.getMe().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      old_password: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', [Validators.required]],
    }, { validators: passwordMatchValidator });
  }

  changePassword(): void {
    if (this.form.invalid) return;
    const { old_password, password } = this.form.value;
    this.passwordLoading.set(true);
    const input: ChangePasswordRequest = {
      old_password: old_password,
      new_password: password,
    };
    this.authService.changePassword(input).subscribe({
      next: () => {
        this.passwordLoading.set(false);
        this.form.reset();
        this.messageService.add({
          key: 'global',
          severity: 'success',
          summary: 'Succès',
          detail: 'Votre mot de passe a bien été modifié.',
          life: 5000,
        });
      },
      error: () => {
        this.passwordLoading.set(false);
        this.form.patchValue({
          old_password: null,
          password: null,
          password_confirm: null,
        });
      },
    });
  }
}
