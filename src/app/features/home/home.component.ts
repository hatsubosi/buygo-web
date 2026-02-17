import { Component , ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBtnComponent } from '../../shared/ui/ui-btn/ui-btn.component';
import { UiContainerComponent } from '../../shared/ui/ui-container/ui-container.component';

@Component({
    selector: 'app-home',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, UiBtnComponent, UiContainerComponent],
    template: `
    <div class="relative overflow-hidden">
        <!-- Hero Section -->
        <div class="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
            <!-- Background Elements -->
            <div class="absolute inset-0 bg-[#0a0a0a]"></div>
            <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]"></div>
            <div class="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]"></div>
            <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10"></div>

            <div class="relative z-20 container mx-auto px-4 text-center">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up">
                    <span class="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="text-sm font-medium text-gray-300">Live Group Buys Available</span>
                </div>

                <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent animate-fade-in-up delay-100">
                    Smart Shopping <br />
                    <span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Together</span>
                </h1>

                <p class="text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200">
                    Join exclusive group buys, unlock tier-based discounts, and participate in community events.
                </p>

                <div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
                    <a routerLink="/groupbuy">
                        <app-ui-btn variant="primary" customClass="!text-lg !px-8 !py-4">
                            Start Exploring
                        </app-ui-btn>
                    </a>
                    <a routerLink="/event">
                        <app-ui-btn variant="secondary" customClass="!text-lg !px-8 !py-4">
                            View Events
                        </app-ui-btn>
                    </a>
                </div>
            </div>
        </div>

        <!-- Features Grid -->
        <div class="container mx-auto px-4 pt-24 pb-24 relative z-20">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <app-ui-container customClass="h-full p-8 hover:scale-105 transition-transform duration-300">
                    <div class="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6">
                        <span class="material-icons text-blue-400 text-2xl">shopping_bag</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">Group Buys</h3>
                    <p class="text-gray-400">Join forces with others to unlock wholesale prices. The more people join, the lower the price drops.</p>
                </app-ui-container>

                <!-- Card 2 -->
                <app-ui-container customClass="h-full p-8 hover:scale-105 transition-transform duration-300">
                    <div class="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
                        <span class="material-icons text-purple-400 text-2xl">event</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">Community Events</h3>
                    <p class="text-gray-400">Participate in exclusive launch parties and meetups. Connect with creators and verified sellers.</p>
                </app-ui-container>

                <!-- Card 3 -->
                <app-ui-container customClass="h-full p-8 hover:scale-105 transition-transform duration-300">
                    <div class="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6">
                        <span class="material-icons text-green-400 text-2xl">verified</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">Verified Creators</h3>
                     <p class="text-gray-400">Shop with confidence. All projects are vetted and managed by verified creators with transparent tracking.</p>
                </app-ui-container>
        </div>
        
        <!-- Explicit Spacer (Moderate) -->
        <div class="h-8 w-full bg-transparent"></div>
    </div>
  `,
    styles: [`
    .animate-fade-in-up {
        animation: fadeInUp 0.8s ease-out forwards;
        opacity: 0;
        transform: translateY(20px);
    }
    .delay-100 { animation-delay: 0.1s; }
    .delay-200 { animation-delay: 0.2s; }
    .delay-300 { animation-delay: 0.3s; }

    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
  `]
})
export class HomeComponent { }
