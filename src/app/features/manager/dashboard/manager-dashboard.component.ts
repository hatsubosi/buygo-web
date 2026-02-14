import { Component, inject, computed, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/project/project.service';
import { EventService } from '../../../core/event/event.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { UserRole } from '../../../core/api/api/v1/auth_pb';

@Component({
  selector: 'app-manager-dashboard',
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiContainerComponent, UiBtnComponent, DatePipe],

    templateUrl: "./manager-dashboard.component.html",
    styleUrl: "./manager-dashboard.component.css"
})
export class ManagerDashboardComponent implements OnInit {
  auth = inject(AuthService);
  projectService = inject(ProjectService);
  eventService = inject(EventService);

  ngOnInit() {
    this.projectService.loadManagerProjects();
    this.eventService.loadManagerEvents();
  }

  isAdmin = computed(() => this.auth.user()?.role === UserRole.SYS_ADMIN);

  projects = computed(() => this.projectService.managerProjects());

  events = computed(() => this.eventService.managerEvents());

  getProjectStatus(status: any): string {
    const map = { 1: 'Draft', 2: 'Active', 3: 'Ended', 4: 'Archived' };
    return (map as any)[status] || 'Unknown';
  }

  getEventStatus(status: any): string {
    const map = { 1: 'Draft', 2: 'Active', 3: 'Cancelled', 4: 'Ended' };
    return (map as any)[status] || 'Unknown';
  }

  toDate(ts: any): Date | null {
    return ts ? ts.toDate() : null;
  }
}
