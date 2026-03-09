import { InjectionToken } from '@angular/core';
import { Environment } from '../../../environments/environment.model';

export const ENVIRONMENT = new InjectionToken<Environment>('environment');
