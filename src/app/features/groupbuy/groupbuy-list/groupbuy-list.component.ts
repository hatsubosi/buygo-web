import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  computed,
  effect,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { GroupBuyStatus } from '../../../core/api/api/v1/groupbuy_pb';

@Component({
  selector: 'app-groupbuy-list',
  imports: [UiContainerComponent, UiBtnComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-8">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <h2 class="text-3xl font-bold text-white">Latest Projects</h2>
        <app-ui-btn variant="ghost">Filter</app-ui-btn>
      </div>

      <!-- Loading State -->
      @if (groupBuyService.isLoadingList()) {
        <div class="flex justify-center p-12">
          <span
            class="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
          ></span>
        </div>
      }

      <!-- Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        @for (project of pagedGroupBuys(); track project.id) {
          <app-ui-container customClass="h-full flex flex-col p-0">
            <!-- Image Placeholder -->
            <div class="h-48 w-full bg-gradient-to-br from-blue-900/50 to-purple-900/50"></div>

            <div class="flex flex-1 flex-col p-6">
              <!-- Status Badge -->
              <div class="mb-2 flex">
                <span
                  class="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300 backdrop-blur-sm border border-blue-500/30"
                >
                  {{ getStatusLabel(project.status) }}
                </span>
              </div>

              <h3 class="mb-2 text-xl font-bold text-white">{{ project.title }}</h3>
              <p class="mb-4 flex-1 text-sm text-gray-400 line-clamp-2">
                {{ project.description }}
              </p>

              <div class="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Deadline</span>
                  <span class="text-sm font-semibold text-gray-300">In 5 Days</span>
                </div>
                <app-ui-btn variant="primary" (onClick)="openProject(project.id)">
                  View Details
                </app-ui-btn>
              </div>
            </div>
          </app-ui-container>
        }
      </div>

      @if (groupBuyService.groupBuys().length > 0) {
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
    </div>
  `,
  styles: [],
})
export class GroupBuyListComponent implements OnInit {
  groupBuyService = inject(GroupBuyService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  page = signal(1);
  pageSize = signal(9);

  pagedGroupBuys = computed(() => {
    const all = this.groupBuyService.groupBuys();
    const size = this.pageSize();
    const start = (this.page() - 1) * size;
    return all.slice(start, start + size);
  });

  totalPages = computed(() => {
    const total = this.groupBuyService.groupBuys().length;
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
    this.groupBuyService.loadGroupBuys();
  }

  getStatusLabel(status: GroupBuyStatus): string {
    switch (status) {
      case GroupBuyStatus.ACTIVE:
        return 'Active';
      case GroupBuyStatus.DRAFT:
        return 'Draft';
      case GroupBuyStatus.ENDED:
        return 'Ended';
      case GroupBuyStatus.ARCHIVED:
        return 'Archived';
      default:
        return 'Unknown';
    }
  }

  openProject(id: string) {
    this.router.navigate(['/groupbuy', id]);
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
