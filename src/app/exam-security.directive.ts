import { Directive, HostListener } from '@angular/core';
import { Router } from '@angular/router'; // Import Router
import { SecurityService } from './security.service';

@Directive({
  selector: '[appExamSecurity]',
  standalone: true
})
export class ExamSecurityDirective {
  constructor(
    private security: SecurityService,
    private router: Router // Inject Router
  ) {}

  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    // If on index page, allow right click
    if (this.router.url === '/') return true;

    event.preventDefault();
    this.security.logAndAlert('RIGHT_CLICK');
    return false;
  }

  @HostListener('document:copy', ['$event'])
  @HostListener('document:paste', ['$event'])
  onClipboard(event: Event) {
    // If on index page, allow copy/paste
    if (this.router.url === '/') return;

    event.preventDefault();
    this.security.logAndAlert('CLIPBOARD');
  }
}