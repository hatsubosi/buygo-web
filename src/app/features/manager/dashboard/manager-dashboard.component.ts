import { Component, inject, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { EventService } from '../../../core/event/event.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { UserRole } from '../../../core/api/api/v1/auth_pb';
import { UiCardComponent } from '../../../shared/ui/ui-card/ui-card.component';
import { toEventStatusLabel, toGroupBuyStatusLabel } from '../../../shared/utils/status-mapper';
import { Timestamp } from '@bufbuild/protobuf';

@Component({
  selector: 'app-manager-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiContainerComponent, UiBtnComponent, DatePipe, UiCardComponent],

  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.css',
})
export class ManagerDashboardComponent implements OnInit {
  auth = inject(AuthService);
  groupBuyService = inject(GroupBuyService);
  eventService = inject(EventService);

  ngOnInit() {
    this.groupBuyService.loadManagerProjects();
    this.eventService.loadManagerEvents();
  }

  isAdmin = computed(() => this.auth.user()?.role === UserRole.SYS_ADMIN);

  projects = computed(() => this.groupBuyService.managerGroupBuys());

  events = computed(() => this.eventService.managerEvents());

  getProjectStatus(status: number): string {
    return toGroupBuyStatusLabel(status);
  }

  getEventStatus(status: number): string {
    return toEventStatusLabel(status);
  }

  toDate(ts?: Timestamp | { toDate: () => Date } | null): Date | null {
    return ts ? ts.toDate() : null;
  }
}
