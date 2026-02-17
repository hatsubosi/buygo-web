import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  computed,
  effect,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/event/event.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { Timestamp } from '@bufbuild/protobuf';

@Component({
  selector: 'app-event-list',
  imports: [RouterLink, UiContainerComponent, DatePipe, UiBtnComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-8">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <h1 class="text-3xl font-bold text-white">Upcoming Events</h1>
        <div class="flex gap-2">
          <!-- Placeholder for filters if needed -->
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (event of pagedEvents(); track event.id) {
          <app-ui-container
            customClass="h-full flex flex-col p-0 cursor-pointer transition-transform hover:scale-[1.02]"
            [routerLink]="['/event', event.id]"
          >
            <div class="h-48 w-full bg-gradient-to-br from-indigo-900/50 to-pink-900/50 relative">
              <div class="absolute inset-0 flex items-center justify-center text-white/20">
                <span class="material-icons text-5xl">event</span>
              </div>
            </div>
            <div class="flex flex-1 flex-col p-6">
              <h2 class="text-xl font-bold text-white mb-2">{{ event.title }}</h2>
              <p class="text-sm text-gray-400 mb-4">
                {{ toDate(event.startTime) | date: 'mediumDate' }} -
                {{ toDate(event.endTime) | date: 'mediumDate' }}
              </p>
              <p class="text-sm text-gray-400 line-clamp-2 mb-4">{{ event.description }}</p>

              <div class="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                <span class="text-xs text-gray-500">
                  {{ event.location || 'Online Event' }}
                </span>
                <app-ui-btn variant="primary" size="sm" [routerLink]="['/event', event.id]">
                  View Details
                </app-ui-btn>
              </div>
            </div>
          </app-ui-container>
        }
      </div>

      @if (eventService.events().length > 0) {
        <div class="mt-8 flex items-center justify-between">
          <span class="text-sm text-gray-400">Page {{ page() }} / {{ totalPages() }}</span>
          <div class="flex gap-2">
            <app-ui-btn variant="outline" size="sm" (onClick)="prevPage()" [disabled]="!hasPrev()">
              Previous
            </app-ui-btn>
            <app-ui-btn variant="outline" size="sm" (onClick)="nextPage()" [disabled]="!hasNext()">
              Next
            </app-ui-btn>
          </div>
        </div>
      }

      @if (eventService.events().length === 0 && !eventService.isLoading()) {
        <div class="text-center py-12 bg-white/5 rounded-lg border border-white/10">
          <p class="text-gray-400">No active events found.</p>
        </div>
      }
    </div>
  `,
})
export class EventListComponent implements OnInit {
  eventService = inject(EventService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  page = signal(1);
  pageSize = signal(9);

  pagedEvents = computed(() => {
    const all = this.eventService.events();
    const size = this.pageSize();
    const start = (this.page() - 1) * size;
    return all.slice(start, start + size);
  });

  totalPages = computed(() => {
    const total = this.eventService.events().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  hasPrev = computed(() => this.page() > 1);
  hasNext = computed(() => this.page() < this.totalPages());

  constructor() {
    effect(() => {
      const max = this.totalPages();
      if (this.page() > max) {
        this.page.set(max);
      }
    });
  }

  ngOnInit() {
    const pageFromQuery = Number(this.route.snapshot.queryParamMap.get('page'));
    if (Number.isInteger(pageFromQuery) && pageFromQuery > 0) {
      this.page.set(pageFromQuery);
    }
    this.eventService.loadEvents();
  }

  toDate(ts?: Timestamp): Date | null {
    if (!ts) return null;
    return new Date(Number(ts.seconds) * 1000 + ts.nanos / 1000000);
  }

  nextPage() {
    if (!this.hasNext()) return;
    this.page.update((p) => p + 1);
    this.syncPageToUrl();
  }

  prevPage() {
    if (!this.hasPrev()) return;
    this.page.update((p) => p - 1);
    this.syncPageToUrl();
  }

  private syncPageToUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: this.page() },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
