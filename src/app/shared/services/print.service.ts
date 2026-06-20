import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PrintService {
  printElement(element: HTMLElement, onDone?: () => void): void {
    const originalParent = element.parentNode;
    const originalNextSibling = element.nextSibling;

    const printStage = document.createElement('div');
    printStage.id = 'print-stage';
    document.body.appendChild(printStage);
    printStage.appendChild(element);
    document.body.classList.add('is-printing-target');

    const cleanup = () => {
      document.body.classList.remove('is-printing-target');
      originalParent?.insertBefore(element, originalNextSibling);
      printStage.remove();
      window.removeEventListener('afterprint', cleanup);
      onDone?.();
    };
    window.addEventListener('afterprint', cleanup);

    window.print();
  }
}
