import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from './environment';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private isLockedSource = new BehaviorSubject<boolean>(false);
  isLocked$ = this.isLockedSource.asObservable();

  // Guard to prevent the "Alert Loop"
  public isHandlingViolation = false;

  constructor(private http: HttpClient, private router: Router) {}

  logAndAlert(code: string) {
    // If we are already showing an alert, don't trigger another one
    if (this.isHandlingViolation) return;

    this.isHandlingViolation = true;
    this.lock();

    const messages: { [key: string]: string } = {
      'TAB_SWITCH': '⚠️ CRITICAL: Tab switching detected. Logging out!',
      'EXIT_FULLSCREEN': '⚠️ CRITICAL: Fullscreen exited. Logging out!',
      'RIGHT_CLICK': '🚫 BLOCKED: Right-click is disabled.',
      'KEYBOARD_SHORTCUT': '🚫 BLOCKED: Developer tools are prohibited.',
      'CLIPBOARD': '🚫 BLOCKED: Copy/Paste is disabled.'
    };

    // Show the alert (This pauses the browser)
    alert((messages[code] || 'Security Violation!')+" block for 45 minutes");
    this.handleForceLogout();  
  }

  private handleForceLogout() {
    localStorage.clear();
    sessionStorage.clear();

    this.http.post(`${environment.apiUrl}/Auth/logout`, {isViolation: true}, {
      responseType: 'text',
      withCredentials: true,
    }).subscribe({
      next: () => console.log("Session invalidated"),
      error: () => console.warn("Logout API unreachable")
    });

    this.isHandlingViolation = false;
    this.unlock();
    this.router.navigate(['/']);
  }

  lock() { this.isLockedSource.next(true); }
  unlock() { this.isLockedSource.next(false); }

  get currentLockStatus(): boolean {
    return this.isLockedSource.value;
  }
}