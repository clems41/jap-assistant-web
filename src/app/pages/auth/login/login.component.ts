import {Component, inject} from '@angular/core';
import {AuthService, LoginRequest} from '../../../shared/services/auth.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {PasswordModule} from 'primeng/password';
import {ButtonModule} from 'primeng/button';
import {Router, RouterLink} from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    RouterLink,
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  form: FormGroup = this.buildForm();
  loading: boolean = false;

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    })
  }

  login(): void {
    if (this.form.invalid) return
    const {email, password} = this.form.value;
    this.loading = true;
    const input: LoginRequest = {email, password};
    this.authService.login(input).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']).then();
      },
      error: () => {
        this.loading = false;
        this.form.reset();
      }
    })
  }
}
