import {Component, inject, signal} from '@angular/core';
import {Button} from "primeng/button";
import {InputText} from "primeng/inputtext";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {AuthService, ResetPasswordRequest} from '../../../shared/services/auth.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-password-forgotten',
  imports: [
    Button,
    InputText,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './password-forgotten.component.html'
})
export class PasswordForgottenComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  form: FormGroup = this.buildForm();
  loading = signal(false);
  emailSent = signal(false);

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    })
  }

  resetPassword(): void {
    if (this.form.invalid) return
    const {email} = this.form.value;
    this.loading.set(true);
    const input: ResetPasswordRequest = {email};
    this.authService.resetPassword(input).subscribe({
      next: () => {
        this.loading.set(false);
        this.emailSent.set(true);

      },
      error: () => {
        this.loading.set(false);
        this.form.reset();
      }
    })
  }

}
