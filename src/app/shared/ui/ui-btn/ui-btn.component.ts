import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';

@Component({
  selector: 'app-ui-btn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      (click)="onClick.emit($event)"
      class="relative flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      [class]="getVariantClasses() + ' ' + customClass()"
    >
      <!-- Loading Spinner -->
      @if (loading()) {
        <span class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
      }

      <!-- Icon Input -->
      @if (!loading() && icon()) {
        <span class="material-icons text-lg">{{ icon() }}</span>
      }

      <!-- Icon Slot -->
      <ng-content select="[icon]"></ng-content>
      
      <!-- Content -->
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class UiBtnComponent {
  type = input<'button' | 'submit' | 'reset'>('button');
  variant = input<ButtonVariant>('primary');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  customClass = input<string>('');
  icon = input<string>('');

  onClick = output<MouseEvent>();

  getVariantClasses(): string {
    switch (this.variant()) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:to-purple-500';
      case 'secondary':
        return 'bg-white/10 text-white backdrop-blur-md hover:bg-white/20 border border-white/10';
      case 'outline':
        return 'border-2 border-blue-500/50 text-blue-400 hover:border-blue-400 hover:text-blue-300';
      case 'ghost':
        return 'text-gray-400 hover:text-white hover:bg-white/5';
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50';
      case 'success':
        return 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50';
      default:
        return '';
    }
  }
}
