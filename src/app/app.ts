import { Component, HostListener, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router'; // Ensure RouterOutlet is here if standalone
import { CommonModule } from '@angular/common';
import { SecurityService } from './security.service';
import { ExamSecurityDirective } from './exam-security.directive';

@Component({
  selector: 'app-root',
  standalone: true, // Assuming standalone based on previous turns
  imports: [RouterOutlet, CommonModule, ExamSecurityDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Use a signal for the title as you had before
  protected readonly title = signal('examSmartSeat');
  isLocked = false;

  constructor(
    private security: SecurityService, 
    private router: Router
  ) {}

  ngOnInit() {
    // Sync the lock state with the UI
    this.security.isLocked$.subscribe(status => {
      this.isLocked = status;
    });
  }

  // --- FIX: Remove '$event' from the decorator to stop the red error ---
  @HostListener('window:blur')
  onBlur() {
    // 1. Logic Guard: Only secure pages (Login/Exam), not Index ('/')
    if (this.router.url === '/'||this.router.url === '/login') return;

    // 2. Logic Guard: Don't trigger if an alert is already open
    if (this.security.isHandlingViolation) return;

    // 3. Optional: Check if user is actually logged in before punishing
    const token = localStorage.getItem('token');
    if (token) {
      console.log("Alt+Tab or Window Switch detected!");
      this.security.logAndAlert('TAB_SWITCH');
    }
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    // Catches minimizing the browser or "Show Desktop" (Win+D)
    if (document.hidden && this.router.url !== '/' && !this.security.isHandlingViolation) {
      this.security.logAndAlert('TAB_SWITCH');
    }
  }
}