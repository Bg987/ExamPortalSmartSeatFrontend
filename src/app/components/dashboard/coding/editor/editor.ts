import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editor',
  imports: [CommonModule,FormsModule],
  templateUrl: './editor.html',
  styleUrl: './editor.css',
})
export class Editor {
  boilerplates: any = {
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}`,
    python: `print("Hello World")`
  };
  executionResult: any = null; // To store the output
  selectedLanguage: string = 'java';
  code: string = this.boilerplates['java']; // Default starting code
  problemId: any;
  problem: any;
  testCases: any[] = [];
  isLoading: boolean = false;
  url: String = environment.apiUrl2;
  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient,
    private cdr : ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 1. Get the ID from the URL (/editor/503)
    this.problemId = this.route.snapshot.paramMap.get('id');
    if (this.problemId) {
      this.loadTestCases(this.problemId);
      this.loadProblem(this.problemId);
    }
  }

  loadTestCases(id: string) {
    this.isLoading = true;
    // 2. Call your Compiler Backend on Port 8083
    this.http.get(`${this.url}/api/code/getTestCases/${id}`)
      .subscribe({
        next: (data: any) => {
          this.testCases = data;
          console.log(data);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error fetching test cases from Port 8083:", err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  loadProblem(id: string) {
    this.isLoading = true;
    // 2. Call your Compiler Backend on Port 8083
    this.http.get(`${this.url}/api/code/getProblem/${id}`)
      .subscribe({
        next: (data: any) => {
          this.problem = data;
          console.log(data);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error fetching test cases from Port 8083:", err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }
  onLanguageChange(event: any) {
  this.selectedLanguage = event.target.value;
    this.code = this.boilerplates[this.selectedLanguage];
  }
  
  runCode() {
    this.isLoading = true;
    this.executionResult = null;

    // The object must match your CodeDTO exactly
    const requestPayload = {
      code: this.code,
      language: this.selectedLanguage.toUpperCase(), // Match Enum naming (JAVA, CPP)
      problemId: this.problemId
    };

    this.http.post(`${this.url}/api/code/runTestCases`, requestPayload)
      .subscribe({
        next: (response: any) => {
          this.executionResult = response;
          this.isLoading = false;
          console.log("Execution successful:", response);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Execution failed:", err);
          this.executionResult = { error: "Server Error: Could not run code." };
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }
}
