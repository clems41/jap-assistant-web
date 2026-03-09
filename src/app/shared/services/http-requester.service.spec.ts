import { TestBed } from '@angular/core/testing';

import { HttpRequesterService } from './http-requester.service';

describe('HttpRequesterService', () => {
  let service: HttpRequesterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpRequesterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
