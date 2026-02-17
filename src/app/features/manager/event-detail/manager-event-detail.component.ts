import {
  Component,
  inject,
  computed,
  input,
  effect,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe, CurrencyPipe, SlicePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../core/event/event.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { UiDialogComponent } from '../../../shared/ui/ui-dialog/ui-dialog.component';
import { Timestamp } from '@bufbuild/protobuf';
import { UserRole } from '../../../core/api/api/v1/auth_pb';

@Component({
  selector: 'app-manager-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    UiContainerComponent,
    UiBtnComponent,
    DatePipe,
    CurrencyPipe,
    SlicePipe,
    FormsModule,
    UiDialogComponent,
  ],
  templateUrl: './manager-event-detail.component.html',
  styleUrl: './manager-event-detail.component.css',
})
export class ManagerEventDetailComponent {
  // Implements OnInit removed to use signal effect logic if desired, or restore it.
  eventService = inject(EventService);
  auth = inject(AuthService);
  router = inject(Router);
  toastService = inject(ToastService);

  // Router input
  id = input<string>();

  registrations = signal<any[]>([]); // Type Registration[]

  @ViewChild(UiDialogComponent) dialog!: UiDialogComponent;

  constructor() {
    effect(() => {
      const e = this.event();
      const user = this.auth.user();
      if (e && user) {
        if (user.role === UserRole.SYS_ADMIN) return;

        const isCreator = e.creator?.id === user.id;
        const isManager = e.managers.some((m) => m.id === user.id);

        if (!isCreator && !isManager) {
          this.router.navigate(['/manager']);
        }
      }
    });

    // Auto load registrations when event loads?
    effect(() => {
      const e = this.event();
      if (e) {
        this.loadRegistrations();
      }
    });

    effect(() => {
      const id = this.id();
      if (id) {
        this.eventService.loadEvent(id);
      }
    });
  }

  event = this.eventService.currentEvent;

  async loadRegistrations() {
    const e = this.event();
    if (!e) return;
    try {
      const regs = await this.eventService.listEventRegistrations(e.id);
      // Sort by User Name, then by ID for stability
      regs.sort((a, b) => {
        const nameA = a.user?.name || 'Guest';
        const nameB = b.user?.name || 'Guest';
        const nameCompare = nameA.localeCompare(nameB);
        if (nameCompare !== 0) return nameCompare;
        return a.id.localeCompare(b.id);
      });
      this.registrations.set(regs);
    } catch (err) {
      console.error('Failed to load regs', err);
    }
  }

  async updateStatus(reg: any, status: any, paymentStatus: any) {
    // Optimistic update or wait? Let's refresh after.
    // Convert string to number if coming from select
    const s = Number(status);
    const ps = Number(paymentStatus);

    try {
      await this.eventService.updateRegistrationStatus(reg.id, s, ps);
      // Refresh logic - or manual splice
      this.loadRegistrations(); // Easiest for consistency
    } catch (err) {
      this.toastService.show('Error updating status', 'error');
      console.error(err);
    }
  }

  getItemName(itemId: string): string {
    const item = this.event()?.items.find((i) => i.id === itemId);
    return item ? item.name : 'Unknown Item';
  }

  getEventStatus(status: any): string {
    const map = { 1: 'Draft', 2: 'Active', 3: 'Cancelled', 4: 'Ended' };
    return (map as any)[status] || 'Unknown';
  }

  getRegStatus(status: any): string {
    const map = { 1: 'Pending', 2: 'Confirmed', 3: 'Cancelled' };
    return (map as any)[status] || 'Unknown';
  }

  getPaymentStatus(status: any): string {
    // Assuming: 1=Unpaid, 2=Submitted, 3=Confirmed/Paid, 4=Refunded
    const map = { 1: 'Unpaid', 2: 'Submitted', 3: 'Paid', 4: 'Refunded' };
    return (map as any)[status] || 'Unknown';
  }

  toDate(ts: any): Date | null {
    return ts ? ts.toDate() : null;
  }

  async changeEventStatus(status: number) {
    // 2=Active, 4=Ended
    const e = this.event();
    if (!e) return;

    let action = '';
    switch (status) {
      case 2:
        action = 'publish';
        break;
      case 3:
        action = 'end';
        break;
      case 4:
        action = 'archive';
        break;
      default:
        return;
    }

    const confirmed = await this.dialog.open({
      title: `Confirm ${action}`,
      message: `Are you sure you want to ${action} this event?`,
      type: status === 3 || status === 4 ? 'destructive' : 'default',
      confirmText: 'Yes, proceed',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      await this.eventService.updateEventStatus(e.id, status);
      // Refresh
      this.eventService.loadEvent(e.id);
      // Grammar fix for 'end' -> 'ended', 'publish' -> 'published', 'archive' -> 'archived'
      // Simple suffix 'ed' works for these cases.
      this.toastService.show(`Event ${action}ed successfully`, 'success');
    } catch (err: any) {
      this.toastService.show(err.message || 'Failed to update status', 'error');
    }
  }

  copyPublicLink() {
    const url = `${window.location.origin}/event/${this.event()?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.show('Public link copied to clipboard!', 'success');
    });
  }

  protected readonly toNumber = Number;
}
