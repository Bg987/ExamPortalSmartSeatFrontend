import { Routes } from '@angular/router';
import { LoginComponent } from '../app/components/login/login';
import { Dashboard } from '../app/components/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: Dashboard },
];