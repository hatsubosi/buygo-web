import { Component, inject, signal, model, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { User } from '../../../../core/api/api/v1/auth_pb';


@Component({
    selector: 'app-manager-selector',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule],
    templateUrl: './manager-selector.component.html',

})
export class ManagerSelectorComponent implements OnInit {
    private authService = inject(AuthService);

    // Model input/output for selected IDs (array of strings)
    selectedIds = model<string[]>([]);

    // Available managers list
    managers = signal<User[]>([]);
    isLoading = signal(false);

    async ngOnInit() {
        this.isLoading.set(true);
        try {
            const res = await this.authService.listAssignableManagers();
            this.managers.set(res.managers);
        } catch (err) {
            console.error('Failed to load managers', err);
        } finally {
            this.isLoading.set(false);
        }
    }

    toggleSelection(userId: string) {
        const current = this.selectedIds();
        if (current.includes(userId)) {
            this.selectedIds.set(current.filter(id => id !== userId));
        } else {
            this.selectedIds.set([...current, userId]);
        }
    }

    isSelected(userId: string): boolean {
        return this.selectedIds().includes(userId);
    }
}
