import { Routes } from '@angular/router';
import { SRCalculator } from './features/sr-calculator/sr-calculator';

export const routes: Routes = [
  {
    path: '',
    component: SRCalculator
  },
  {
    path: '**',
    redirectTo: ''
  }
];
