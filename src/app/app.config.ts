import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MyPreset } from './preset';
import { ENVIRONMENT } from './core/tokens/environment.token';
import { environment } from '../environments/environment';
import {MessageService} from 'primeng/api';
import {fr} from "primelocale/js/fr.js";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    MessageService,
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    { provide: ENVIRONMENT, useValue: environment },
    providePrimeNG({
      translation: fr,
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: false,
        }
      }
    }),
  ]
};
