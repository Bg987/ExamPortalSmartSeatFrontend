import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-get-exam',
  standalone: true,
  imports: [CommonModule, HttpClientModule], 
  templateUrl: './get-exam.html',
  styleUrl: './get-exam.css',
})
export class GetExam implements OnInit, OnDestroy {
  incompleteExams: any[] = [];
  isLoading: boolean = false;
  url: String = environment.apiUrl;
  
  currentTime: Date = new Date();
  private timerId: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.fetchExams();
    // Refresh the clock every minute to update "Starting Soon" status
    this.timerId = setInterval(() => {
      this.currentTime = new Date();
      this.cdr.detectChanges();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  fetchExams() {
    this.isLoading = true;
    this.http.get<any[]>(`${this.url}/api/ExamStudent/getStudentIncomplteExam`, {
      withCredentials: true,
    })
    .subscribe({
      next: (data) => {
        this.incompleteExams = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Check if Port 8081 is running!", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Categorizes exam based on Date and Time
   * SOON: Today and starts within 30 minutes
   * TODAY: Scheduled for today but > 30 mins away
   * UPCOMING: Scheduled for a future date
   */
  getExamStatus(exam: any): 'SOON' | 'TODAY' | 'UPCOMING' {
    if (!exam.Date || !exam.time) return 'UPCOMING';

    // Create a Date object from the exam Date (YYYY-MM-DD) and Time (HH:mm:ss)
    const examDateTime = new Date(`${exam.Date}T${exam.time}`);
    
    const diffInMs = examDateTime.getTime() - this.currentTime.getTime();
    const diffInMins = diffInMs / (1000 * 60);

    // Is it today?
    const isToday = new Date(exam.Date).toDateString() === this.currentTime.toDateString();

    if (isToday) {
      // If today and starts within 30 minutes (but hasn't ended)
      if (diffInMins <= 30 && diffInMins >= -(exam.duration)) { // Assuming 2 hour exam duration
        return 'SOON';
      }
      return 'TODAY';
    }

    return 'UPCOMING';
  }

  enterExam(examId: number) {
    this.router.navigate(['/editor', examId]);
  }
}