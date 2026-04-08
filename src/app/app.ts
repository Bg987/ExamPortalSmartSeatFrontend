import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { SecurityService } from './security.service';
import { ExamSecurityDirective } from './exam-security.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ExamSecurityDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
  
export class App implements OnInit {
  protected readonly title = signal('examSmartSeat');
  
  // State to show a "Locked" overlay if a violation occurs
  isLocked = false;

  // Modern Angular 'inject' pattern (cleaner than constructor)
  private security = inject(SecurityService);

  ngOnInit() {
    // Listen for security locks to update the UI globally
    this.security.isLocked$.subscribe(status => {
      this.isLocked = status;
    });
  }
}