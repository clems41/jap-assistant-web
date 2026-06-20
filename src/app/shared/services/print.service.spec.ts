import { TestBed } from '@angular/core/testing';
import { PrintService } from './print.service';

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('PrintService', () => {
  let service: PrintService;
  let container: HTMLElement;
  let element: HTMLElement;
  let sibling: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PrintService],
    });
    service = TestBed.inject(PrintService);

    container = document.createElement('div');
    element = document.createElement('div');
    sibling = document.createElement('span');
    container.appendChild(element);
    container.appendChild(sibling);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.classList.remove('is-printing-target');
    document.getElementById('print-stage')?.remove();
    container.remove();
  });

  // -------------------------------------------------------------------------
  // Creation
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // printElement()
  // -------------------------------------------------------------------------

  describe('printElement()', () => {
    it('should move the element into a dedicated print stage appended to body and mark the body before calling window.print', () => {
      spyOn(window, 'print');

      service.printElement(element);

      const stage = document.getElementById('print-stage');
      expect(stage?.parentElement).toBe(document.body);
      expect(element.parentElement).toBe(stage);
      expect(document.body.classList.contains('is-printing-target')).toBeTrue();
      expect(window.print).toHaveBeenCalledTimes(1);
    });

    it('should restore the element to its exact original position and remove the print stage after afterprint fires', () => {
      spyOn(window, 'print');

      service.printElement(element);
      window.dispatchEvent(new Event('afterprint'));

      expect(element.parentElement).toBe(container);
      expect(element.nextSibling).toBe(sibling);
      expect(document.getElementById('print-stage')).toBeNull();
      expect(document.body.classList.contains('is-printing-target')).toBeFalse();
    });

    it('should call onDone after afterprint fires', () => {
      spyOn(window, 'print');
      const onDone = jasmine.createSpy('onDone');

      service.printElement(element, onDone);
      expect(onDone).not.toHaveBeenCalled();

      window.dispatchEvent(new Event('afterprint'));

      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('should work without an onDone callback', () => {
      spyOn(window, 'print');

      expect(() => {
        service.printElement(element);
        window.dispatchEvent(new Event('afterprint'));
      }).not.toThrow();
    });

    it('should only clean up once even if afterprint fires multiple times', () => {
      spyOn(window, 'print');
      const onDone = jasmine.createSpy('onDone');

      service.printElement(element, onDone);
      window.dispatchEvent(new Event('afterprint'));
      window.dispatchEvent(new Event('afterprint'));

      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });
});
