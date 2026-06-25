import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import { LoadingPageComponent } from './loading.page';

describe('LoadingPageComponent', () => {
  async function setup(redirect?: string) {
    await TestBed.configureTestingModule({
      imports: [LoadingPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(redirect !== undefined ? { redirect } : {}),
            },
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigateByUrlSpy = spyOn(router, 'navigateByUrl');

    const fixture = TestBed.createComponent(LoadingPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    return { fixture, navigateByUrlSpy };
  }

  it('should create the component', async () => {
    const { fixture } = await setup('/home');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('navigates to the redirect target after the next render', async () => {
    const { navigateByUrlSpy } = await setup('/home');

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/home', { replaceUrl: true });
  });

  it('falls back to /home when no redirect query param is present', async () => {
    const { navigateByUrlSpy } = await setup(undefined);

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/home', { replaceUrl: true });
  });

  it('falls back to /home when redirect points back to /loading (anti-loop)', async () => {
    const { navigateByUrlSpy } = await setup('/loading?redirect=%2Fhome');

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/home', { replaceUrl: true });
  });
});
