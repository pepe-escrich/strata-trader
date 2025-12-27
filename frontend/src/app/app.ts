import { Component, signal, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ButtonModule, ToolbarModule, TooltipModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('StrataTrader v1');
  protected readonly darkMode = signal(false);

  constructor() {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode.set(savedDarkMode);

    // Apply dark mode on init
    effect(() => {
      if (this.darkMode()) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    });
  }

  toggleDarkMode() {
    this.darkMode.update(v => !v);
    localStorage.setItem('darkMode', this.darkMode().toString());
  }
}
