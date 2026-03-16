import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService, ResetPasswordConfirmRequest} from '../../../shared/services/auth.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {FieldErrorComponent} from '../../../shared/components/field-error/field-error.component';
import {PasswordModule} from 'primeng/password';
import {passwordMatchValidator} from '../../../shared/validators/form.validators';

@Component({
  selector: 'app-reset-password',
  imports: [
    ButtonModule,
    ReactiveFormsModule,
    FieldErrorComponent,
    PasswordModule
  ],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  form: FormGroup = this.buildForm();
  loading = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.router.navigate(['/auth/login']).then();
      return;
    }
    this.form.patchValue({ token });
  }

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      token: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', [Validators.required]],
    }, { validators: passwordMatchValidator })
  }

  resetPassword(): void {
    if (this.form.invalid) return
    const {token, password} = this.form.value;
    this.loading.set(true);
    const input: ResetPasswordConfirmRequest = {
      token: token,
      new_password: password
    };
    this.authService.resetPasswordConfirm(input).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/auth/login']).then();
      },
      error: () => {
        this.loading.set(false);
        this.form.reset();
      }
    })
  }
}
