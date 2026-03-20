import { Routes } from '@angular/router';
import { LoginComponent } from '../app/components/login/login';
import { Dashboard } from '../app/components/dashboard/dashboard';
import { ShowProblem } from './components/dashboard/coding/show-problem/show-problem';
import { Editor } from './components/dashboard/coding/editor/editor';
import { GetExam } from './components/dashboard/exam/get-exam/get-exam';
import { MainExam } from './components/dashboard/exam/main-exam/main-exam';


export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: Dashboard },
  //exam portal
  { path: 'getExams', component: GetExam },
  { path: 'Exam/:id', component: MainExam },
  //coding 
  { path: 'showProblem', component: ShowProblem },
  { path: 'editor/:id', component: Editor },
];