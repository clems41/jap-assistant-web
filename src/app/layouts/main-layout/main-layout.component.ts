import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { MenuModule } from 'primeng/menu';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MenuModule],
  templateUrl: './main-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  private navigationEnd$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => {
      let route = this.router.routerState.root;
      while (route.firstChild) {
        route = route.firstChild;
      }
      return (route.snapshot?.data?.['title'] as string) ?? null;
    }),
  );

  readonly pageTitle = toSignal(this.navigationEnd$, { initialValue: null });

  protected goHome(): void {
    this.router.navigate(['/home']).then();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']).then();
  }

  protected userProfile(): void {
    this.router.navigate(['/user-profile']).then();
  }
}
