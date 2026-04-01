import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [],
  templateUrl: './index.html',
  styleUrl: './index.css',
})
export class Index {
  constructor(private router: Router) {}

  async startExamPortal() {
    try {
      const elem = document.documentElement;

      // 1. Request Fullscreen (Required for your Hard Block Security)
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) { /* Safari */
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) { /* IE11 */
        await (elem as any).msRequestFullscreen();
      }

      // 2. Navigate to login once fullscreen is active
      this.router.navigate(['/login']);
      
    } catch (err) {
      alert("Error: You must allow Fullscreen Mode to access the Exam Portal.");
      console.error("Fullscreen blocked:", err);
    }
  }
}