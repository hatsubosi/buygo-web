import {
  Component,
  inject,
  OnInit,
  effect,
  computed,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/event/event.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { UiDialogComponent } from '../../../shared/ui/ui-dialog/ui-dialog.component';
import { FormsModule } from '@angular/forms';
import { Timestamp } from '@bufbuild/protobuf';
import {
  RegisterItem,
  Registration,
  EventItem,
  RegistrationStatus,
} from '../../../core/api/api/v1/event_pb';

@Component({
  selector: 'app-event-detail',
  imports: [
    UiContainerComponent,
    UiBtnComponent,
    DatePipe,
    FormsModule,
    RouterLink,
    UiDialogComponent,
  ],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailComponent implements OnInit {
  eventService = inject(EventService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  toastService = inject(ToastService);

  @ViewChild(UiDialogComponent) dialog!: UiDialogComponent;

  myRegistration = signal<Registration | null>(null);
  itemQuantities = signal<Record<string, number>>({});
  notes = '';

  constructor() {
    effect(() => {
      const user = this.authService.user();
      const event = this.eventService.currentEvent();
      if (user && event) {
        this.loadMyRegistration();
      }
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventService.loadEvent(id);
    }
  }

  async loadMyRegistration() {
    const eventId = this.eventService.currentEvent()?.id;
    const user = this.authService.user();
    if (!eventId || !user) return;

    try {
      const regs = await this.eventService.getMyRegistrations();
      const found = regs.find((r) => r.eventId === eventId);
      if (found) {
        this.myRegistration.set(found);
        this.notes = found.notes;

        // Pre-fill quantities
        const quantities: Record<string, number> = {};
        found.selectedItems.forEach((i: RegisterItem) => {
          quantities[i.eventItemId] = i.quantity;
        });
        this.itemQuantities.set(quantities);
      }
    } catch (err) {
      console.error('Failed to load registrations', err);
    }
  }

  updateQuantity(itemId: string, delta: number) {
    this.itemQuantities.update((qs) => {
      const current = qs[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const { [itemId]: removed, ...rest } = qs;
        return rest;
      }
      return { ...qs, [itemId]: next };
    });
  }

  toggleItem(itemId: string) {
    this.itemQuantities.update((qs) => {
      if (qs[itemId]) {
        const { [itemId]: removed, ...rest } = qs;
        return rest;
      } else {
        return { ...qs, [itemId]: 1 };
      }
    });
  }

  getItemQuantity(itemId: string): number {
    return this.itemQuantities()[itemId] || 0;
  }

  totalQuantity = computed(() => {
    return Object.values(this.itemQuantities()).reduce((a, b) => a + b, 0);
  });

  subtotalPrice = computed(() => {
    const qs = this.itemQuantities();
    const event = this.eventService.currentEvent();
    if (!event) return 0;

    let total = 0;
    for (const [itemId, qty] of Object.entries(qs)) {
      const item = event.items.find((i) => i.id === itemId);
      if (item) {
        total += Number(item.price) * qty;
      }
    }
    return total;
  });

  discountAmount = computed(() => {
    const event = this.eventService.currentEvent();
    const totalQty = this.totalQuantity();
    if (!event || !event.discounts || event.discounts.length === 0) return 0;

    // Find best discount
    let maxDiscount = 0;
    for (const rule of event.discounts) {
      // Proto wrapper fields might be BigInt or number, check carefully
      const minQty = rule.minQuantity;
      const amount = Number(rule.discountAmount);

      if (totalQty >= minQty) {
        if (amount > maxDiscount) {
          maxDiscount = amount;
        }
      }
    }

    // Cap at subtotal
    const subtotal = this.subtotalPrice();
    if (maxDiscount > subtotal) return subtotal;

    return maxDiscount;
  });

  totalPrice = computed(() => {
    return this.subtotalPrice() - this.discountAmount();
  });

  getSelectedItemsList() {
    const qs = this.itemQuantities();
    const event = this.eventService.currentEvent();
    if (!event) return [];

    return Object.entries(qs).map(([itemId, qty]) => {
      const item = event.items.find((i) => i.id === itemId);
      return {
        name: item?.name || 'Unknown',
        quantity: qty,
        total: Number(item?.price || 0) * qty,
      };
    });
  }

  canManage = computed(() => {
    const user = this.authService.user();
    const event = this.eventService.currentEvent();
    if (!user || !event) return false;
    return event.creator?.id === user.id || event.managers.some((m) => m.id === user.id);
  });

  private checkAuth(): boolean {
    if (this.authService.isAuthenticated()) return true;
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return false;
  }

  async submitRegistration() {
    if (!this.checkAuth()) return;
    const event = this.eventService.currentEvent();
    if (!event) return;

    const items = Object.entries(this.itemQuantities()).map(
      ([id, qty]) =>
        new RegisterItem({
          eventItemId: id,
          quantity: qty,
        }),
    );

    if (items.length === 0) {
      this.toastService.show('Please select at least one item.', 'error');
      return;
    }

    try {
      if (this.myRegistration()) {
        await this.eventService.updateRegistration(
          this.myRegistration()!.id,
          items,
          this.myRegistration()!.contactInfo,
          this.notes,
        );
        this.toastService.show('Registration Updated!', 'success');
      } else {
        await this.eventService.register(
          event.id,
          items,
          JSON.stringify({ note: 'Web RSVP' }),
          this.notes,
        );
        this.toastService.show('Registration Successful!', 'success');
      }
      this.loadMyRegistration();
    } catch (err: any) {
      console.error(err);
      this.toastService.show(err.message || 'Operation failed', 'error');
    }
  }

  async cancelRegistration() {
    if (!this.myRegistration()) return;

    const confirmed = await this.dialog.open({
      title: 'Cancel Registration',
      message: 'Are you sure you want to cancel your registration? This action cannot be undone.',
      type: 'destructive',
      confirmText: 'Yes, Cancel',
      cancelText: 'Keep Registration',
    });

    if (!confirmed) return;

    try {
      await this.eventService.cancelRegistration(this.myRegistration()!.id);
      this.toastService.show('Registration Cancelled', 'info');
      this.loadMyRegistration();
    } catch (err: any) {
      this.toastService.show(err.message || 'Failed to cancel', 'error');
    }
  }

  toDate(ts?: Timestamp): Date | null {
    if (!ts) return null;
    return new Date(Number(ts.seconds) * 1000 + ts.nanos / 1000000);
  }

  shouldShowTime(item: EventItem): boolean {
    const start = this.toDate(item.startTime);
    const end = this.toDate(item.endTime);
    if (!start || !end) return false;
    // Check if year is 1970 (proto default 0)
    if (start.getFullYear() < 2000) return false;
    return true;
  }

  formatPrice(price: bigint | number | undefined): string {
    if (price === undefined || price === null) return 'Free';
    const p = Number(price);
    return p === 0 ? 'Free' : '$' + p;
  }

  getStatusLabel(status: RegistrationStatus): string {
    switch (status) {
      case RegistrationStatus.PENDING:
        return 'Pending';
      case RegistrationStatus.CONFIRMED:
        return 'Confirmed';
      case RegistrationStatus.CANCELLED:
        return 'Cancelled';
      case RegistrationStatus.UNSPECIFIED:
        return 'Unspecified';
      default:
        return 'Unknown';
    }
  }
}
