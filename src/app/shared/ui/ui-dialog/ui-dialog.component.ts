import {
  Component,
  inject,
  signal,
  Renderer2,
  ChangeDetectionStrategy,
} from '@angular/core';
import { UiBtnComponent } from '../ui-btn/ui-btn.component';

@Component({
  selector: 'app-ui-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiBtnComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          (click)="close()"
          (keyup.enter)="close()"
          (keyup.space)="close()"
          tabindex="0"
          role="button"
          aria-label="Close dialog"
        ></div>

        <!-- Dialog Panel -->
        <div
          class="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-[#0F0F13] border border-white/10 p-6 shadow-2xl transition-all"
        >
          <h3 class="text-xl font-bold text-white mb-2">{{ title() }}</h3>

          <div class="mt-2">
            <p class="text-sm text-gray-300">
              {{ message() }}
            </p>
          </div>

          <div class="mt-8 flex justify-end gap-3">
            @if (showCancel()) {
              <app-ui-btn variant="ghost" (click)="onCancel()">{{ cancelText() }}</app-ui-btn>
            }
            <app-ui-btn
              [variant]="type() === 'destructive' ? 'danger' : 'primary'"
              (click)="onConfirm()"
              >{{ confirmText() }}</app-ui-btn
            >
          </div>
        </div>
      </div>
    }
  `,
})
export class UiDialogComponent {
  isOpen = signal(false);
  title = signal('');
  message = signal('');
  type = signal<'default' | 'destructive'>('default');
  confirmText = signal('Confirm');
  cancelText = signal('Cancel');
  showCancel = signal(true);

  private resolveRef: ((value: boolean) => void) | null = null;
  private renderer = inject(Renderer2);

  open(options: {
    title: string;
    message: string;
    type?: 'default' | 'destructive';
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
  }): Promise<boolean> {
    this.title.set(options.title);
    this.message.set(options.message);
    this.type.set(options.type || 'default');
    this.confirmText.set(options.confirmText || 'Confirm');
    this.cancelText.set(options.cancelText || 'Cancel');
    this.showCancel.set(options.showCancel ?? true);
    this.isOpen.set(true);
    this.renderer.addClass(document.body, 'overflow-hidden');

    return new Promise((resolve) => {
      this.resolveRef = resolve;
    });
  }

  close() {
    this.isOpen.set(false);
    this.renderer.removeClass(document.body, 'overflow-hidden');
    if (this.resolveRef) {
      this.resolveRef(false);
      this.resolveRef = null;
    }
  }

  onConfirm() {
    this.isOpen.set(false);
    this.renderer.removeClass(document.body, 'overflow-hidden');
    if (this.resolveRef) {
      this.resolveRef(true);
      this.resolveRef = null;
    }
  }

  onCancel() {
    this.close();
  }
}
