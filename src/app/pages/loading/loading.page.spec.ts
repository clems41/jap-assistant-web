import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import { LoadingPageComponent } from './loading.page';

describe('LoadingPageComponent', () => {
  async function setup(platformId: 'browser' | 'server', redirect?: string) {
    await TestBed.configureTestingModule({
      imports: [LoadingPageComponent],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: platformId },
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

    return { fixture, navigateByUrlSpy };
  }

  it('should create the component', async () => {
    const { fixture } = await setup('browser', '/home');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('navigates to the redirect target when running in the browser', async () => {
    const { fixture, navigateByUrlSpy } = await setup('browser', '/home');

    fixture.detectChanges();

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/home', { replaceUrl: true });
  });

  it('falls back to /home when no redirect query param is present', async () => {
    const { fixture, navigateByUrlSpy } = await setup('browser', undefined);

    fixture.detectChanges();

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/home', { replaceUrl: true });
  });

  it('falls back to /home when redirect points back to /loading (anti-loop)', async () => {
    const { fixture, navigateByUrlSpy } = await setup('browser', '/loading?redirect=%2Fhome');

    fixture.detectChanges();

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/home', { replaceUrl: true });
  });

  it('never navigates when running on the server', async () => {
    const { fixture, navigateByUrlSpy } = await setup('server', '/home');

    fixture.detectChanges();

    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });
});
