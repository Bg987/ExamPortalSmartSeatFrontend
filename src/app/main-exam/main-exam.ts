import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../environment';

@Component({
  selector: 'app-main-exam',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterModule],
  templateUrl: './main-exam.html',
  styleUrl: './main-exam.css',
})
export class MainExam implements OnInit {
  // Exam Identifiers
  examId!: string;
  examData: any = null;

  // States
  isVerified: boolean = false;
  isLoading: boolean = true; 
  isOffline: boolean = false;
  password: string = '';
  currentIndex: number = 0;
  errorMessage: string = '';

  // Student Progress (Keyed by Question Text for Shuffle Resilience)
  userAnswers: { [key: string]: string } = {};
  flaggedQuestions: Set<number> = new Set();

  // Network Status Listeners
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
    // First, try to auto-resume if the student already entered the password once
    this.checkAutoResume();
  }

  /**
   * Hits the verify API with an empty password.
   * If the Backend sees 'attendance = true' in the SeatAllocation table,
   * it returns the questions immediately.
   */
  checkAutoResume() {
    this.isLoading = true;
    const url = `${environment.apiUrl}/exam/verify/${this.examId}`;
    
    this.http.post<any>(url, { password: "" }, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.handleEntrySuccess(res.data);
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoading = false;
          this.isVerified = false;// Show password input
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Manual verification for first-time entry
   */
  verifyExam() {
    if (!this.password || this.password.length < 6) {
      this.errorMessage = "Please enter a valid 6-digit password.";
      return;
    }

    this.isLoading = true;
    const url = `${environment.apiUrl}/exam/verify/${this.examId}`;
    this.http.post<any>(url, { password: this.password }, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.handleEntrySuccess(res.data);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || "Invalid Password or Unauthorized Access";
          this.cdr.detectChanges();
        }
      });
  }

  private handleEntrySuccess(data: any) {
    // 1. Load progress from LocalStorage before shuffling
    this.loadProgress();

    // 2. Generate a unique seed for this specific student session
    // This ensures User A and User B have different question orders
    const studentId = localStorage.getItem('enrollmentNo') || 'anon'; 
    const seed = `${this.examId}_${studentId}`;

    // 3. Perform Seeded Shuffle on Questions
    let shuffledQuestions = this.shuffleArray(data.questions, seed);
    
    // 4. Shuffle Options within each question using a sub-seed
    shuffledQuestions = shuffledQuestions.map((q, idx) => ({
      ...q,
      options: this.shuffleArray(q.options, seed + "_q" + idx)
    }));

    this.examData = { ...data, questions: shuffledQuestions };
    this.isVerified = true;
    this.isLoading = false;
    this.errorMessage = '';
  }

  // --- SEEDED SHUFFLE HELPERS ---
  private seededRandom(seed: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    }
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

  // --- EXAM INTERACTIONS ---
  selectOption(option: string) {
    const currentQ = this.examData.questions[this.currentIndex];
    // We save the text as the key to remain immune to shuffle changes
    this.userAnswers[currentQ.text] = option; 
    this.saveProgress();
  }

  toggleFlag() {
    if (this.flaggedQuestions.has(this.currentIndex)) {
      this.flaggedQuestions.delete(this.currentIndex);
    } else {
      this.flaggedQuestions.add(this.currentIndex);
    }
  }

  getButtonClass(index: number): string {
    const qText = this.examData.questions[index].text;
    if (this.currentIndex === index) return 'btn-current';
    if (this.flaggedQuestions.has(index)) return 'btn-flagged';
    if (this.userAnswers[qText]) return 'btn-attempted';
    return 'btn-unattempted';
  }

  // --- PERSISTENCE LAYER ---
  saveProgress() {
    localStorage.setItem(`smartseat_progress_${this.examId}`, JSON.stringify(this.userAnswers));
  }

  loadProgress() {
    const saved = localStorage.getItem(`smartseat_progress_${this.examId}`);
    if (saved) {
      this.userAnswers = JSON.parse(saved);
    }
  }

  submitFinal() {
    if (confirm("Warning: You cannot edit answers after submission. Proceed?")) {
      const payload = {
        examId: this.examId,
        answers: this.userAnswers // Map of QuestionText -> OptionText
      };
      
      this.http.post(`${environment.apiUrl}/exam/submit`, payload, { withCredentials: true })
        .subscribe({
          next: () => {
            alert("Exam Submitted Successfully!");
            localStorage.removeItem(`smartseat_progress_${this.examId}`);
            this.router.navigate(['/get-exam']);
          },
          error: (err) => {
            alert("Submission failed. Error: " + (err.error?.error || "Connection Lost"));
          }
        });
    }
  }
}