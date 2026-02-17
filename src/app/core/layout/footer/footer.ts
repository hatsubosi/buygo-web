import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <footer class="border-t border-white/5 bg-[#0a0a0a] pt-16 pb-8">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <!-- Brand -->
          <div class="col-span-1 md:col-span-2">
            <a routerLink="/" class="flex items-center gap-2 mb-4">
              <span
                class="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              >
                BuyGo
              </span>
            </a>
            <p class="text-gray-400 max-w-sm">
              Smart shopping together. Join exclusive group buys, unlock tier-based discounts, and
              participate in community events.
            </p>
          </div>

          <!-- Links -->
          <div>
            <h4 class="text-white font-bold mb-4">Platform</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li>
                <a routerLink="/groupbuy" class="hover:text-blue-400 transition-colors"
                  >Group Buys</a
                >
              </li>
              <li>
                <a routerLink="/event" class="hover:text-blue-400 transition-colors">Events</a>
              </li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Creators</a></li>
            </ul>
          </div>

          <!-- Support -->
          <div>
            <h4 class="text-white font-bold mb-4">Support</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a href="#" class="hover:text-blue-400 transition-colors">Help Center</a></li>
              <li>
                <a href="#" class="hover:text-blue-400 transition-colors">Terms of Service</a>
              </li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div
          class="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p class="text-gray-500 text-sm">© 2024 BuyGo Platform. All rights reserved.</p>
          <div class="flex items-center gap-6">
            <!-- Socials (Mock) -->
            <a href="#" class="text-gray-500 hover:text-white transition-colors"
              ><span class="material-icons text-xl">facebook</span></a
            >
            <a href="#" class="text-gray-500 hover:text-white transition-colors"
              ><span class="material-icons text-xl">thumb_up</span></a
            >
            <a href="#" class="text-gray-500 hover:text-white transition-colors"
              ><span class="material-icons text-xl">share</span></a
            >
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class Footer {}
