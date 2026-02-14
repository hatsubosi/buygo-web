import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
    selector: 'app-ui-toast',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="fixed top-20 right-4 z-[60] flex flex-col gap-2">
            @for (toast of toastService.toasts(); track toast.id) {
                <div class="px-4 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 animate-slide-in"
                    [class.bg-green-600]="toast.type === 'success'"
                    [class.bg-red-600]="toast.type === 'error'"
                    [class.bg-blue-600]="toast.type === 'info'">
                    <div class="flex items-center gap-2">
                        @if (toast.type === 'success') {
                            <span class="material-icons text-sm">check_circle</span>
                        }
                        @if (toast.type === 'error') {
                            <span class="material-icons text-sm">error</span>
                        }
                        @if (toast.type === 'info') {
                            <span class="material-icons text-sm">info</span>
                        }
                        <span>{{ toast.message }}</span>
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        @keyframes slide-in {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
            animation: slide-in 0.3s ease-out;
        }
    `]
})
export class UiToastComponent {
    toastService = inject(ToastService);
}
