import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [UiContainerComponent, UiBtnComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-4"
    >
      <app-ui-container customClass="w-full max-w-md p-8 relative z-10">
        <div class="text-center mb-10">
          <h2
            class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            Welcome Back
          </h2>
          <p class="text-gray-400 mt-2">Sign in to continue to BuyGo</p>
        </div>

        <div class="flex flex-col gap-6">
          <!-- Mock Line Login -->
          <app-ui-btn
            variant="primary"
            customClass="w-full justify-center"
            (onClick)="login('line')"
            [loading]="auth.isLoading() && activeProvider === 'line'"
          >
            <span class="w-full">Continue with Line</span>
          </app-ui-btn>

          <!-- Mock Google Login -->
          <app-ui-btn
            variant="secondary"
            customClass="w-full justify-center"
            (onClick)="login('google')"
            [loading]="auth.isLoading() && activeProvider === 'google'"
          >
            <span class="w-full">Continue with Google</span>
          </app-ui-btn>

          <!-- Divider -->
          <div class="flex items-center gap-4 py-2">
            <div class="h-px flex-1 bg-white/10"></div>
            <span class="text-xs uppercase text-gray-500">Or continue with</span>
            <div class="h-px flex-1 bg-white/10"></div>
          </div>

          <!-- Mock Creator Login (Dev) -->
          <app-ui-btn
            variant="ghost"
            customClass="w-full justify-center"
            (onClick)="login('creator')"
            [loading]="auth.isLoading() && activeProvider === 'creator'"
          >
            <span class="w-full">Developer Creator Access</span>
          </app-ui-btn>

          <!-- Mock Email Login (Dev) -->
          <app-ui-btn
            variant="ghost"
            customClass="w-full justify-center"
            (onClick)="login('dev')"
            [loading]="auth.isLoading() && activeProvider === 'dev'"
          >
            <span class="w-full">Developer Guest Access</span>
          </app-ui-btn>

          <!-- Mock Admin Login (Dev) -->
          <app-ui-btn
            variant="ghost"
            customClass="w-full justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10"
            (onClick)="login('admin')"
            [loading]="auth.isLoading() && activeProvider === 'admin'"
          >
            <span class="w-full">Developer Admin Access</span>
          </app-ui-btn>
        </div>
      </app-ui-container>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class LoginComponent {
  auth = inject(AuthService);
  activeProvider: string | null = null;

  login(provider: string) {
    this.activeProvider = provider;
    // Mock Token: mock-token-{provider}
    // Backend will use the suffix as ID.
    // e.g. mock-token-dev -> ID: dev, Name: User dev
    const mockToken = `mock-token-${provider}`;
    this.auth.login(provider, mockToken);
  }
}
