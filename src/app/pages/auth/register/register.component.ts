import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {FieldErrorComponent} from '../../../shared/components/field-error/field-error.component';
import {AuthService, LoginRequest, RegisterRequest} from '../../../shared/services/auth.service';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {Router, RouterLink} from '@angular/router';
import {PasswordModule} from 'primeng/password';

@Component({
  selector: 'app-register',
  imports: [
    ButtonModule,
    InputTextModule,
    ReactiveFormsModule,
    RouterLink,
    PasswordModule,
    FieldErrorComponent,
  ],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  form: FormGroup = this.buildForm();
  loading = signal(false);

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('password_confirm')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', [Validators.required]],
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator })
  }

  register(): void {
    if (this.form.invalid) return
    const {email, password, first_name, last_name} = this.form.value;
    this.loading.set(true);
    const input: RegisterRequest = {
      email: email,
      password: password,
      first_name: first_name,
      last_name: last_name,
    };
    this.authService.register(input)
      .subscribe({
        next: () => {
          const loginInput: LoginRequest = {
            email: email,
            password: password,
          }
          this.authService.login(loginInput).subscribe({
            next: () => {
              this.loading.set(false);
              this.router.navigate(['/home']).then();
            },
            error: () => {
              this.loading.set(false);
              this.router.navigate(['/auth/login']).then();
            }
          })
        },
        error: () => {
          this.loading.set(false);
        }
      })
  }

}
