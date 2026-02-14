import { Component, inject, signal, ViewChild , ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { UiDialogComponent } from '../../../shared/ui/ui-dialog/ui-dialog.component';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { User, UserRole } from '../../../core/api/api/v1/auth_pb';

@Component({
    selector: 'app-manager-user-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, UiContainerComponent, UiBtnComponent, UiDialogComponent],
    template: `
    <div class="min-h-screen pt-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <app-ui-container customClass="p-8">
        <!-- Header -->
        <div class="mb-8 flex items-center justify-between">
          <div>
            <div class="mb-2 flex items-center gap-2">
                <a routerLink="/manager" class="text-gray-400 hover:text-white">
                    <span class="material-icons text-sm">arrow_back</span> Back
                </a>
            </div>
            <h1 class="text-3xl font-bold text-white">User Management</h1>
            <p class="mt-2 text-gray-400">Manage user roles and permissions</p>
          </div>
        </div>

        <!-- User List -->
         <div class="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-white/5 text-xs uppercase text-gray-400">
                    <tr>
                        <th class="px-6 py-4">User</th>
                        <th class="px-6 py-4">Email</th>
                        <th class="px-6 py-4">Role</th>
                        <th class="px-6 py-4">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                     @if (users().length === 0) {
                        <tr>
                            <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                                Loading users...
                            </td>
                        </tr>
                     } @else {
                        @for (user of users(); track user.id) {
                            <tr class="hover:bg-white/5">
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                         @if (user.photoUrl) {
                                            <img [src]="user.photoUrl" class="h-8 w-8 rounded-full" alt="">
                                         } @else {
                                            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                                {{ user.name.charAt(0) }}
                                            </div>
                                         }
                                         <span class="font-medium text-white">{{ user.name }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-gray-300">{{ user.email }}</td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                                        [class]="getRoleBadgeClass(user.role)">
                                        {{ getRoleName(user.role) }}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                     <div class="flex gap-2">
                                        @if (user.role !== 3) { <!-- Cannot edit SysAdmin for safety for now -->
                                            @if (user.role === 1) {
                                                <app-ui-btn variant="outline" size="sm" (onClick)="updateRole(user, 2)">
                                                    Promote to Creator
                                                </app-ui-btn>
                                            } @else {
                                                <app-ui-btn variant="outline" size="sm" (onClick)="updateRole(user, 1)">
                                                    Demote to User
                                                </app-ui-btn>
                                            }
                                        }
                                     </div>
                                </td>
                            </tr>
                        }
                     }
                </tbody>
            </table>
         </div>

         <!-- Pagination -->
         <div class="mt-4 flex items-center justify-between">
            <span class="text-sm text-gray-400">Page {{ page() }}</span>
            <div class="flex gap-2">
                <app-ui-btn variant="outline" size="sm" (onClick)="prevPage()" [disabled]="page() === 1 || isLoading()">
                    Previous
                </app-ui-btn>
                <app-ui-btn variant="outline" size="sm" (onClick)="nextPage()" [disabled]="!hasMore() || isLoading()">
                    Next
                </app-ui-btn>
            </div>
         </div>

      </app-ui-container>
      <app-ui-dialog></app-ui-dialog>
    </div>
  `
})
export class ManagerUserListComponent {
    auth = inject(AuthService);
    toast = inject(ToastService);

    @ViewChild(UiDialogComponent) dialog!: UiDialogComponent;

    users = signal<User[]>([]);

    page = signal(1);
    pageSize = signal(20);
    hasMore = signal(false);
    isLoading = signal(false);

    constructor() {
        this.loadUsers();
    }

    async loadUsers() {
        this.isLoading.set(true);
        try {
            // Note: Current backend API might not return total count or next page token, 
            // so 'hasMore' is a guess if we get full page size.
            // Ideally backend returns a PageResponse with total/next.
            const res = await this.auth.listUsers(this.page(), this.pageSize());
            this.users.set(res.users);
            this.hasMore.set(res.users.length === this.pageSize());
        } catch (err) {
            console.error('Failed to load users', err);
        } finally {
            this.isLoading.set(false);
        }
    }

    nextPage() {
        this.page.update(p => p + 1);
        this.loadUsers();
    }

    prevPage() {
        if (this.page() > 1) {
            this.page.update(p => p - 1);
            this.loadUsers();
        }
    }

    async updateRole(user: User, newRole: number) {
        const confirmed = await this.dialog.open({
            title: 'Confirm Role Change',
            message: `Are you sure you want to change ${user.name}'s role?`,
            confirmText: 'Change Role'
        });

        if (!confirmed) return;

        try {
            await this.auth.updateUserRole(user.id, newRole);
            // Reload to ensuring consistency
            this.loadUsers();
            this.toast.show('User role updated', 'success');
        } catch (err) {
            console.error('Failed to update role', err);
            this.toast.show('Failed to update role', 'error');
        }
    }

    getRoleName(role: number): string {
        switch (role) {
            case UserRole.SYS_ADMIN: return 'System Admin';
            case UserRole.CREATOR: return 'Creator';
            case UserRole.USER: return 'User';
            default: return 'Guest';
        }
    }

    getRoleBadgeClass(role: number): string {
        switch (role) {
            case UserRole.SYS_ADMIN: return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case UserRole.CREATOR: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
        }
    }
}
