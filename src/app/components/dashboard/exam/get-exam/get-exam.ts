declare var SafeExamBrowser: any;



import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-get-exam',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './get-exam.html',
  styleUrl: './get-exam.css',
})
export class GetExam implements OnInit, OnDestroy {
  incompleteExams: any[] = [];
  isLoading: boolean = false;
  url: string = environment.apiUrl;
  
  currentTime: Date = new Date();
  private timerId: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.fetchExams();
    // Refresh the clock every minute
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
    let sebKey = "";
    if (typeof SafeExamBrowser !== 'undefined' && SafeExamBrowser.security) {
      sebKey = SafeExamBrowser.security.configKey; }
    
    const headers = {
    'X-SafeExamBrowser-ConfigKeyhash': sebKey
  };
  
    this.http.get<any>(`${this.url}/ExamStudent/getStudentIncomplteExam`, {
      withCredentials: true,
      headers: headers
    })
    .subscribe({
      next: (data) => {
        if (data.enrNumber) {
          localStorage.setItem('enrollmentNo', data.enrNumber);
        }
        this.incompleteExams = data.exams || []; 
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("API Error:", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Logic: 
   * - SOON: Within 25 mins of start OR exam is currently running
   * - TODAY: Scheduled for today but more than 25 mins away
   * - UPCOMING: Future date
   */
getExamStatus(exam: any): 'SOON' | 'TODAY' | 'UPCOMING' {
    // 1. Combine Date (2026-03-20) and time (13:10:00)
    // Result: "2026-03-20T13:10:00"
    const examDateTimeStr = `${exam.Date}T${exam.time}`;
    const examStartTime = new Date(examDateTimeStr);

    // 2. Calculate the difference in minutes
    const diffInMs = examStartTime.getTime() - this.currentTime.getTime();
    const diffInMins = diffInMs / (1000 * 60);

    // DEBUG LOGS (Check these in F12 console)
    console.log(`Exam: ${exam.examName} | Diff: ${diffInMins.toFixed(1)} mins`);

    // 3. Logic based on your current time (13:15) and exam time (13:10)
    // Since 13:15 is AFTER 13:10, diffInMins will be -5.
    
    const isToday = examStartTime.toDateString() === this.currentTime.toDateString();

    if (isToday) {
         if (diffInMins <= 2 && diffInMins >= -(exam.duration)) {
            return 'SOON';
        }
        return 'TODAY';
    }

    return 'UPCOMING';
}

  // PASSING DATA VIA ROUTER STATE
  enterExam(exam: any) {
    this.router.navigate(['/Exam', exam.id], {
      state: { 
        startTime: exam.time, 
        duration: exam.duration 
      }
    });
  }
}