import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environment';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-main-exam',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterModule],
  templateUrl: './main-exam.html',
  styleUrl: './main-exam.css'
})
export class MainExam implements OnInit, OnDestroy {
  examId!: string;
  examData: any = null;

  // States
  isVerified: boolean = false;
  isLoading: boolean = true;
  isOffline: boolean = false; // Used for both network & sync timeout
  password: string = '';
  currentIndex: number = 0;
  errorMessage: string = '';

  // Timer & Sync
  remainingTime: string = '00:00';
  private timerInterval: any;
  private syncTimer: any; 
  passedStartTime: any;
  passedDuration: number = 0;

  userAnswers: { [key: string]: string } = {};
  flaggedQuestions: Set<number> = new Set();

  @HostListener('window:offline') onOffline() { this.isOffline = true; }
  @HostListener('window:online') onOnline() { this.isOffline = false; }

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.passedStartTime = navigation.extras.state['startTime'];
      this.passedDuration = navigation.extras.state['duration'];
    }
  }

  ngOnInit() {
    this.examId = this.route.snapshot.paramMap.get('id') || '';
    this.checkAutoResume();
  }

  ngOnDestroy() {
    this.stopTimer();
    if (this.syncTimer) clearTimeout(this.syncTimer);
  }

  checkAutoResume() {
    this.isLoading = true;
    const url = `${environment.apiUrl}/exam/verify/${this.examId}`;
    this.http.post<any>(url, { password: "" }, { withCredentials: true })
      .subscribe({
        next: (res) => this.handleEntrySuccess(res.data),
        error: () => {
          this.isLoading = false;
          this.isVerified = false;
          this.cdr.detectChanges();
        }
      });
  }

  verifyExam() {
    if (!this.password || this.password.length < 6) {
      this.errorMessage = "Enter valid 6-digit password.";
      return;
    }
    this.isLoading = true;
    const url = `${environment.apiUrl}/exam/verify/${this.examId}`;
    this.http.post<any>(url, { password: this.password }, { withCredentials: true })
      .subscribe({
        next: (res) => this.handleEntrySuccess(res.data),
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || "Invalid Password";
          this.cdr.detectChanges();
        }
      });
  }

  private handleEntrySuccess(data: any) {
    // 1. DEVICE SYNC: Prioritize DB answers, merge with LocalStorage
    if (data.answers) {
        this.userAnswers = data.answers;
    }
    this.loadProgress(); // Merges local changes if they exist

    // 2. Timer Setup
    let startTimeStr = this.passedStartTime || data.time;
    if (startTimeStr && !startTimeStr.includes('-')) {
        startTimeStr = `${new Date().toISOString().split('T')[0]}T${startTimeStr}`;
    }

    const duration = this.passedDuration || data.duration || 180;
    const studentId = localStorage.getItem('enrollmentNo') || 'anon';
    const seed = `${this.examId}_${studentId}`;

    // 3. Shuffle
    let shuffledQuestions = this.shuffleArray(data.questions, seed);
    shuffledQuestions = shuffledQuestions.map((q, idx) => ({
        ...q,
        options: this.shuffleArray(q.options, seed + "_q" + idx)
    }));

    this.examData = { ...data, questions: shuffledQuestions, startTime: startTimeStr, duration: duration };
    this.isVerified = true;
    this.isLoading = false;
    this.startTimer();
    this.cdr.detectChanges();
  }

  // --- SYNC WITH TIMEOUT ---
  selectOption(option: string) {
    const currentQ = this.examData.questions[this.currentIndex];
    this.userAnswers[currentQ.text] = option; 
    this.saveProgress();

    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this.syncWithServer(), 2000);
  }

  syncWithServer() {
    const payload = { examId: this.examId, answers: this.userAnswers };
    
    this.http.post(`${environment.apiUrl}/exam/sync`, payload, { withCredentials: true })
      .pipe(
        timeout(5000), // 5-second timeout for background sync
        catchError(err => {
          console.warn("Sync slow or failed, relying on local storage.");
            return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.isOffline = false;
          console.log("Cloud Sync Success");
          this.cdr.detectChanges();
        },
        error: () => {
            this.isOffline = true;
            this.cdr.detectChanges();
        }
      });
  }

  // --- SUMMARY & SUBMIT ---
  getSummary() {
    if (!this.examData) return { total: 0, answered: 0, remaining: 0, flagged: 0 };
    const total = this.examData.questions.length;
    const answered = Object.keys(this.userAnswers).length;
    return { total, answered, remaining: total - answered, flagged: this.flaggedQuestions.size };
  }

  submitFinal(isAuto: boolean = false) {
    const summary = this.getSummary();
    if (!isAuto) {
      const confirmMsg = `Summary: ${summary.answered}/${summary.total} answered. Proceed?`;
      if (!confirm(confirmMsg)) return;
    }

    this.isLoading = true;
    this.stopTimer();

    this.http.post(`${environment.apiUrl}/exam/submit`, { examId: this.examId, answers: this.userAnswers }, { withCredentials: true })
      .pipe(timeout(15000)) // 15s timeout for final submission (Grading takes time)
      .subscribe({
        next: () => {
          localStorage.removeItem(`smartseat_progress_${this.examId}`);
          this.router.navigate(['/get-exam']);
          alert("Submitted successfully!");
        },
        error: () => { 
          this.isLoading = false; 
          alert("Submission timed out. Please try again."); 
        }
      });
  }

  // --- UTILS ---
  private startTimer() {
    this.stopTimer();
    const startTime = new Date(this.examData.startTime).getTime();
    const endTime = startTime + (this.examData.duration * 60000);

    this.timerInterval = setInterval(() => {
        const diff = endTime - new Date().getTime();
        if (diff <= 0) {
            this.stopTimer();
            this.autoSubmit();
            return;
        }
        const h = Math.floor((diff / 3600000) % 24);
        const m = Math.floor((diff / 60000) % 60);
        const s = Math.floor((diff / 1000) % 60);
        this.remainingTime = `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
        this.cdr.detectChanges();
    }, 1000);
  }

  private stopTimer() { if (this.timerInterval) clearInterval(this.timerInterval); }
  private autoSubmit() { this.submitFinal(true); }

  toggleFlag() {
    this.flaggedQuestions.has(this.currentIndex) ? this.flaggedQuestions.delete(this.currentIndex) : this.flaggedQuestions.add(this.currentIndex);
  }

  getButtonClass(index: number): string {
    if (!this.examData) return '';
    const qText = this.examData.questions[index].text;
    if (this.currentIndex === index) return 'current';
    if (this.flaggedQuestions.has(index)) return 'flagged';
    if (this.userAnswers[qText]) return 'attempted';
    return 'unattempted';
  }

  saveProgress() { localStorage.setItem(`smartseat_progress_${this.examId}`, JSON.stringify(this.userAnswers)); }
  loadProgress() {
    const saved = localStorage.getItem(`smartseat_progress_${this.examId}`);
    if (saved) this.userAnswers = JSON.parse(saved);
  }

  private seededRandom(seed: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  private shuffleArray(array: any[], seed: string) {
    const rng = this.seededRandom(seed);
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}