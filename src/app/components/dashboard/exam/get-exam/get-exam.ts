declare var SafeExamBrowser: any;



import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule,Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-get-exam',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './get-exam.html',
  styleUrl: './get-exam.css',
})
export class GetExam implements OnInit, OnDestroy {
  incompleteExams: any[] = [];
  isLoading: boolean = false;
  url: string = environment.apiUrl;
  res: any=null;
  currentTime: Date = new Date();
  private timerId: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private location: Location
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
    this.res=null;
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
        if (data===null) {
      this.res = "No exams found";
      this.incompleteExams = [];
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
        if (data.enrNumber) {
          localStorage.setItem('enrollmentNo', data.enrNumber);
        }
        this.incompleteExams = data.exams || []; 
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if(err.status===403){
          alert(err.error.message);
          this.router.navigate(['/']);
          return;
        }
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
  goBack() {
    this.location.back();
  }
}