import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UiBtnComponent, Footer],
  template: `
    <div class="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30">
      <!-- Navbar -->
      <nav
        class="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl transition-all duration-300"
      >
        <div
          class="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2">
            <span
              class="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              BuyGo
            </span>
          </a>

          <!-- Desktop Navigation -->
          <div
            class="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8"
          >
            <a
              routerLink="/"
              routerLinkActive="text-white"
              [routerLinkActiveOptions]="{ exact: true }"
              class="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Home
            </a>
            <a
              routerLink="/groupbuy"
              routerLinkActive="text-white"
              class="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Projects
            </a>
            <a
              routerLink="/event"
              routerLinkActive="text-white"
              class="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Events
            </a>
          </div>

          <!-- Auth Actions -->
          <div class="flex items-center gap-4">
            @if (auth.isAuthenticated()) {
              <div class="hidden md:flex items-center gap-2">
                <div
                  class="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold"
                >
                  {{ auth.user()?.name?.charAt(0) || 'U' }}
                </div>
                <span class="text-sm font-medium text-gray-300">{{ auth.user()?.name }}</span>
              </div>

              <!-- Manager Hub -->
              @if (canManage()) {
                <a routerLink="/manager" class="hidden sm:block">
                  <app-ui-btn variant="ghost" customClass="!px-3" title="Manager Dashboard">
                    <span class="material-icons text-sm">dashboard</span>
                  </app-ui-btn>
                </a>
              }

              <a routerLink="/user" class="hidden sm:block">
                <app-ui-btn variant="ghost" customClass="!px-3" title="Dashboard">
                  <span class="material-icons text-sm">person</span>
                </app-ui-btn>
              </a>

              <app-ui-btn variant="ghost" (onClick)="logout()" customClass="!px-3 hidden sm:block">
                <span class="material-icons text-sm">logout</span>
              </app-ui-btn>
            } @else {
              <a
                [routerLink]="['/login']"
                [queryParams]="{ returnUrl: router.url }"
                class="hidden sm:block"
              >
                <app-ui-btn variant="primary" customClass="!py-2 !px-4 !text-sm">
                  Sign In
                </app-ui-btn>
              </a>
            }

            <!-- Mobile Menu Toggle -->
            <button
              class="md:hidden p-2 -mr-2 text-gray-400 hover:text-white transition-colors"
              (click)="toggleMobileMenu()"
            >
              <span class="material-icons">{{ mobileMenuOpen() ? 'close' : 'menu' }}</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Mobile Menu Overlay -->
      @if (mobileMenuOpen()) {
        <div
          class="fixed inset-0 top-16 z-40 bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/5 md:hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div class="flex flex-col p-6 space-y-6">
            <a
              routerLink="/"
              (click)="closeMobileMenu()"
              routerLinkActive="text-blue-400"
              [routerLinkActiveOptions]="{ exact: true }"
              class="text-2xl font-bold text-gray-300 hover:text-white transition-colors"
            >
              Home
            </a>
            <a
              routerLink="/groupbuy"
              (click)="closeMobileMenu()"
              routerLinkActive="text-blue-400"
              class="text-2xl font-bold text-gray-300 hover:text-white transition-colors"
            >
              Projects
            </a>
            <a
              routerLink="/event"
              (click)="closeMobileMenu()"
              routerLinkActive="text-blue-400"
              class="text-2xl font-bold text-gray-300 hover:text-white transition-colors"
            >
              Events
            </a>

            <!-- Mobile Auth Links (if signed in) -->
            @if (auth.isAuthenticated()) {
              <div class="h-px bg-white/10 my-4"></div>
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold"
                >
                  {{ auth.user()?.name?.charAt(0) || 'U' }}
                </div>
                <span class="text-lg font-medium text-white">{{ auth.user()?.name }}</span>
              </div>

              @if (canManage()) {
                <a
                  routerLink="/manager"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3 text-lg text-gray-300 hover:text-white"
                >
                  <span class="material-icons">dashboard</span> Manager Dashboard
                </a>
              }

              <a
                routerLink="/user"
                (click)="closeMobileMenu()"
                class="flex items-center gap-3 text-lg text-gray-300 hover:text-white"
              >
                <span class="material-icons">person</span> Dashboard
              </a>

              <button
                (click)="logout()"
                class="flex items-center gap-3 text-lg text-red-400 hover:text-red-300 text-left w-full mt-4"
              >
                <span class="material-icons">logout</span> Sign Out
              </button>
            } @else {
              <div class="h-px bg-white/10 my-4"></div>
              <a
                [routerLink]="['/login']"
                (click)="closeMobileMenu()"
                [queryParams]="{ returnUrl: router.url }"
                class="w-full"
              >
                <app-ui-btn variant="primary" customClass="w-full justify-center !text-lg !py-3">
                  Sign In
                </app-ui-btn>
              </a>
            }
          </div>
        </div>
      }

      <!-- Main Content -->
      <main class="pt-16">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <app-footer></app-footer>
    </div>
  `,
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  router = inject(Router);
  mobileMenuOpen = signal(false);

  logout() {
    this.auth.logout();
    this.mobileMenuOpen.set(false);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 2 || role === 3; // CREATOR or SYS_ADMIN
  });

  isAdmin = computed(() => {
    return this.auth.user()?.role === 3; // SYS_ADMIN
  });
}
