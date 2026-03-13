import {Component, inject} from '@angular/core';
import {AuthService} from '../../../shared/services/auth.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {PasswordModule} from 'primeng/password';
import {ButtonModule} from 'primeng/button';
import {RouterLink} from '@angular/router';

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
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  form: FormGroup = this.buildForm();
  loginLoading: boolean = false;

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    })
  }

  login(): void {
    if (this.form.invalid) return
    const {email, password} = this.form.value;
    this.loginLoading = true;
    this.authService.login(email, password).subscribe({
      next: () => {
        this.loginLoading = false;
      },
      error: () => {
        this.loginLoading = false;
      }
    })
  }
}
