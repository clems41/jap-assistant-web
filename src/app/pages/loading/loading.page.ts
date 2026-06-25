import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

/**
 * Neutral transition route used by `authGuard` / `guestGuard` when they run
 * on the server, where `localStorage` is unavailable and the real auth state
 * can't be determined yet.
 *
 * The server only renders this page's neutral spinner shell. Once hydrated
 * in the browser, it reads the `redirect` query param and navigates to the
 * actual destination with the reliable client-side auth state, avoiding a
 * flash of the wrong page (login vs. protected content).
 *
 * The redirect is issued from `afterNextRender` rather than `ngOnInit`:
 * `afterNextRender` only ever runs in the browser (no `isPlatformServer`
 * check needed) and fires once the current render/hydration pass has fully
 * committed, instead of from inside it — calling `navigateByUrl` mid-hydration
 * triggered an unreliable hang in some browsers.
 */
@Component({
  selector: 'app-loading',
  imports: [LoadingSpinnerComponent],
  templateUrl: './loading.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    afterNextRender(() => {
      const redirect = this.route.snapshot.queryParamMap.get('redirect');
      const target = this.resolveSafeTarget(redirect);
      this.router.navigateByUrl(target, { replaceUrl: true });
    });
  }

  /**
   * Computes the destination to navigate to once the client-side auth state
   * is reliable.
   *
   * Falls back to `/home` when `redirect` is missing, when it points back to
   * `/loading` itself (which would otherwise create an infinite redirect
   * loop), or when it can't be parsed as a URL.
   */
  private resolveSafeTarget(redirect: string | null): string {
    if (!redirect) {
      return '/home';
    }

    try {
      const parsed = this.router.parseUrl(redirect);
      const firstSegment = parsed.root.children['primary']?.segments[0]?.path;

      if (firstSegment === 'loading') {
        return '/home';
      }

      return redirect;
    } catch {
      return '/home';
    }
  }
}
