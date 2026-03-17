import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { authInterceptor } from '../app/interceptor'; 

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('examSmartSeat');
  
}
