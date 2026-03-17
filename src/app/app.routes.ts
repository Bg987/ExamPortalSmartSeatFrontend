import { Routes } from '@angular/router';
import { LoginComponent } from '../app/components/login/login';
import { Dashboard } from '../app/components/dashboard/dashboard';
import { ShowProblem } from './components/dashboard/coding/show-problem/show-problem';


export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: Dashboard },
  { path: 'showProblem', component: ShowProblem },
];