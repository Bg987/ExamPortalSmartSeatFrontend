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
  isLoading: boolean = false;
  isOffline: boolean = false; 
  password: string = '';
  currentIndex: number = 0;
  errorMessage: string = '';

  // Timer & Sync
  remainingTime: string = '00:00';
  private timerInterval: any;
  private syncTimer: any; 
  private endTimeMs: number = 0; // Changed to number for reliable math

  userAnswers: { [key: string]: string } = {};
  flaggedQuestions: Set<number> = new Set();

  @HostListener('window:offline') onOffline() { this.isOffline = true; }
  @HostListener('window:online') onOnline() { this.isOffline = false; }

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.examId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnDestroy() {
    this.stopTimer();
    if (this.syncTimer) clearTimeout(this.syncTimer);
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
    // 1. Sync previous answers
    if (data.answers) {
        this.userAnswers = data.answers;
    }
    this.loadProgress(); 

    // 2. PARSE THE HH:mm:ss FORMAT CORRECTLY
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + 
                    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(now.getDate()).padStart(2, '0');
    
    // Combine today's date with the backend's startTime (HH:mm:ss)
    const fullStartStr = `${todayStr}T${data.startTime}`;
    const startTimeMs = new Date(fullStartStr).getTime();

    // Calculate End Time: StartTime + (Duration * 60000ms)
    const durationMinutes = data.duration || 2; 
    this.endTimeMs = startTimeMs + (durationMinutes * 60000);

    // 3. UI and Questions Setup
    const studentId = localStorage.getItem('enrollmentNo') || 'anon';
    const seed = `${this.examId}_${studentId}`;

    let shuffledQuestions = this.shuffleArray(data.questions, seed);
    shuffledQuestions = shuffledQuestions.map((q, idx) => ({
        ...q,
        options: this.shuffleArray(q.options, seed + "_q" + idx)
    }));

    this.examData = { ...data, questions: shuffledQuestions, duration: durationMinutes };
    this.isVerified = true;
    this.isLoading = false;
    
    this.startTimer(); // Now uses this.endTimeMs internally
    this.cdr.detectChanges();
  }

  // --- TIMER UTILS ---
  private startTimer() {
    this.stopTimer();

    this.timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const diff = this.endTimeMs - now;
        
        if (diff <= 0) {
            this.remainingTime = '00:00';
            this.stopTimer();
            this.submitFinal(true); // TRIGGER AUTO-SUBMIT
            return;
        }

        const h = Math.floor((diff / 3600000) % 24);
        const m = Math.floor((diff / 60000) % 60);
        const s = Math.floor((diff / 1000) % 60);

        // Update the display string
        this.remainingTime = `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
        
        this.cdr.detectChanges();
    }, 1000);
  }

  private stopTimer() { if (this.timerInterval) clearInterval(this.timerInterval); }

  // --- SUBMIT LOGIC ---
  submitFinal(isAuto: boolean = false) {
    this.stopTimer();

    if (!isAuto) {
      const summary = this.getSummary();
      const confirmMsg = `Review Summary:\nAnswered: ${summary.answered}/${summary.total}\n\nAre you sure you want to finish the exam?`;
      if (!confirm(confirmMsg)) {
        this.startTimer(); 
        return;
      }
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    this.saveProgress(); 

    const payload = { 
        examId: this.examId, 
        answers: this.userAnswers,
        isAutoSubmitted: isAuto 
    };

    this.http.post(`${environment.apiUrl}/exam/submit`, payload, { withCredentials: true })
      .pipe(timeout(20000))
      .subscribe({
        next: () => {
          localStorage.removeItem(`smartseat_progress_${this.examId}`);
          this.router.navigate(['/dashboard']);
          alert(isAuto ? "Time's up! Your exam was automatically submitted." : "Exam submitted successfully!");
        },
        error: () => { 
          this.isLoading = false; 
          alert("Submission error. Please check your connection and click Finish again."); 
          this.startTimer(); 
        }
      });
  }

  // --- REMAINING UTILS ---
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
      .pipe(timeout(5000), catchError(err => throwError(() => err)))
      .subscribe({
        next: () => { this.isOffline = false; this.cdr.detectChanges(); },
        error: () => { this.isOffline = true; this.cdr.detectChanges(); }
      });
  }

  getSummary() {
    if (!this.examData) return { total: 0, answered: 0, remaining: 0, flagged: 0 };
    const total = this.examData.questions.length;
    const answered = Object.keys(this.userAnswers).length;
    return { total, answered, remaining: total - answered, flagged: this.flaggedQuestions.size };
  }

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
    if (saved) {
        this.userAnswers = { ...this.userAnswers, ...JSON.parse(saved) };
    }
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