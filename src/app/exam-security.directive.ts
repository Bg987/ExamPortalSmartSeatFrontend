import { Directive, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { SecurityService } from './security.service';

@Directive({
  selector: '[appExamSecurity]',
  standalone: true
})
export class ExamSecurityDirective {
  constructor(
    private security: SecurityService,
    private router: Router
  ) {}

  // 1. Detect Tab Switching / Minimizing Browser
  @HostListener('window:blur')
  onWindowBlur() {
    // Only trigger if we are in the exam (not on the login page)
    if (this.router.url === '/') return;
    
    this.security.logAndAlert('TAB_SWITCH');
  }

  // 2. Block Right-Click
  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    if (this.router.url === '/') return true;

    event.preventDefault();
    this.security.logAndAlert('RIGHT_CLICK');
    return false;
  }

  // 3. Block Copy, Paste, and Cut
  @HostListener('document:copy', ['$event'])
  @HostListener('document:paste', ['$event'])
  @HostListener('document:cut', ['$event'])
  onClipboard(event: Event) {
    if (this.router.url === '/') return;

    event.preventDefault();
    this.security.logAndAlert('CLIPBOARD');
  }

  // 4. Block Developer Tools and Save shortcuts
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.router.url === '/') return;

    const key = event.key.toLowerCase();
    const isCtrl = event.ctrlKey || event.metaKey;

    // F12, F11 (Fullscreen escape), F12 (Dev Tools)
    if (event.key === 'F12' || event.key === 'F11') {
      event.preventDefault();
      this.security.logAndAlert('KEYBOARD_SHORTCUT');
      return;
    }

    // Ctrl + U (Source), Ctrl + S (Save), Ctrl + P (Print)
    if (isCtrl && (key === 'u' || key === 's' || key === 'p')) {
      event.preventDefault();
      this.security.logAndAlert('KEYBOARD_SHORTCUT');
    }
  }
}