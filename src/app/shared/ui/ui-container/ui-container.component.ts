import { Component, input , ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-ui-container',
    changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-xl transition-all duration-300 hover:bg-white/20"
      [class]="customClass()"
    >
      <ng-content></ng-content>
      
      <!-- Gradient Glow Effect -->
      <div class="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl"></div>
    </div>
  `,
  styles: []
})
export class UiContainerComponent {
  customClass = input<string>('');
}
