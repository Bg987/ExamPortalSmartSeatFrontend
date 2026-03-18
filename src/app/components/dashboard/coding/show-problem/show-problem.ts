import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from  '@angular/router'; // 1. Import this } from '@angular/router';
import { CommonModule } from '@angular/common'; // Required for *ngFor
import { environment } from '../../../../environment';

// 1. Define the Interface outside the class
export interface CodingQuestion {
  id: number;
  title: string | null;
  problemStatement: string;
  assigned: boolean;
}

@Component({
  selector: 'app-show-problem',
  standalone: true, // Ensure this is present
  imports: [CommonModule,RouterLink], // Add CommonModule here to use *ngFor in HTML
  templateUrl: './show-problem.html',
  styleUrl: './show-problem.css',
})
export class ShowProblem implements OnInit {
  
  // 2. Inject dependencies using the modern inject() function
  private http = inject(HttpClient);
  private router = inject(Router);
  private url = environment.apiUrl2;
  questions: CodingQuestion[] = [];


  constructor(private cdr: ChangeDetectorRef){}
  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    // 3. Make sure environment.apiUrl is used in production, but localhost is fine for now
    this.http.get<CodingQuestion[]>(`${this.url}/api/student/getQuestions`)
      .subscribe({
        next: (data) => {
          // Optional: Filter out 'dummy' questions
          this.questions = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Failed to load coding questions", err);
        }
      });
  }

  openCompiler(id: number) {
    
    this.router.navigate(['/editor', id]);
  }
}