import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiToastComponent } from './shared/ui/ui-toast/ui-toast.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, UiToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

}
