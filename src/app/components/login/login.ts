import { Component, ElementRef, ViewChild, AfterViewInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RedirectCommand, Router } from '@angular/router';
import { environment } from '../../environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrl: './login.css', 
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  response: String = '';
  enrNo: string = '';
  error: string = '';
  url = environment.apiUrl;
  capturedImage: string | null = null;
  imageBlob: Blob | null = null;
  isVerifying: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
  private cd : ChangeDetectorRef) { }

  ngAfterViewInit() {
    this.startCamera();
  }

  startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => this.video.nativeElement.srcObject = stream)
      .catch(() => this.error = "Camera access denied.");
  }

  // --- STEP 1: CAPTURE THE PHOTO ---
  capturePhoto() {
    if (!this.enrNo) {
      this.error = "Please enter Enrollment Number first!";
      return;
    }
    this.error = '';
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext('2d')?.drawImage(this.video.nativeElement, 0, 0);
    
    // Show preview to user
    this.capturedImage = canvas.toDataURL('image/jpeg');
    
    // Convert to Blob for later sending
    canvas.toBlob(blob => {
      this.imageBlob = blob;
    }, 'image/jpeg');
  }

  // --- STEP 2: SEND TO SERVER ---
  verifyFace() {
    if (!this.imageBlob) return;
    
    this.isVerifying = true;
    const formData = new FormData();
    formData.append('enrollmentNumber', this.enrNo);
    formData.append('image', this.imageBlob, 'capture.jpg');

    this.http.post<any>(`${this.url}/Auth/login`, formData, {
      withCredentials: true,
    }).subscribe({
      next: (res) => {
      this.isVerifying = false;
      // Structure is now ALWAYS { status: string, message: string, verified: boolean }
        if (res.status === 'success' && res.verified === true) {
          localStorage.setItem('token',res.data);
          this.router.navigate(['/dashboard']);
      } else {
        this.response = res;
        this.error = res.message; // Shows "Face match failed" or "Biometric missing"
        }
        this.cd.detectChanges();
    },
      error: (err) => {
        this.isVerifying = false;
        console.log(err.error.message);
      // err.error will now also follow the { status: 'error', message: '...' } structure
        this.error = err.error?.message || "Connection lost";
        this.cd.detectChanges();
      }
    });
  }

  retake() {
    this.capturedImage = null;
    this.imageBlob = null;
    this.response = "";
    this.error = "";
    this.enrNo = "";
    // Re-initialize camera stream if needed
    setTimeout(() => this.startCamera(), 100);
  }
}