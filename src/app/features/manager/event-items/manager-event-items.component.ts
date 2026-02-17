import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../core/event/event.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { Event, Registration } from '../../../core/api/api/v1/event_pb';

interface ItemGroup {
  itemId: string;
  name: string;
  price: number;
  totalQuantity: number;
  registrations: Array<{
    reg: Registration;
    quantity: number;
  }>;
}

@Component({
  selector: 'app-manager-event-items',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiContainerComponent],
  templateUrl: './manager-event-items.component.html',
  styleUrl: './manager-event-items.component.css',
})
export class ManagerEventItemsComponent {
  eventService = inject(EventService);
  route = inject(ActivatedRoute);

  event = signal<Event | undefined>(undefined);
  registrations = signal<Registration[]>([]);

  itemGroups = computed(() => {
    const e = this.event();
    const regs = this.registrations();
    if (!e) return [];

    const groups = new Map<string, ItemGroup>();

    // Initialize groups from Event Items
    e.items.forEach((item) => {
      groups.set(item.id, {
        itemId: item.id,
        name: item.name,
        price: Number(item.price),
        totalQuantity: 0,
        registrations: [],
      });
    });

    // Populate from Registrations
    regs.forEach((reg) => {
      // Skip cancelled registrations from count? Maybe kep them but show status.
      // Let's include everything for now.
      reg.selectedItems.forEach((sel) => {
        const group = groups.get(sel.eventItemId);
        if (group) {
          group.registrations.push({ reg, quantity: sel.quantity });
          // Only count quantity if not cancelled?
          // Usually "Sold" implies valid sales.
          if (reg.status !== 3) {
            // 3 = Cancelled
            group.totalQuantity += sel.quantity;
          }
        }
      });
    });

    return Array.from(groups.values());
  });

  constructor() {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.loadData(id);
      }
    });
  }

  async loadData(id: string) {
    await this.eventService.loadEvent(id);
    this.event.set(this.eventService.currentEvent() || undefined);

    try {
      const regs = await this.eventService.listEventRegistrations(id);
      this.registrations.set(regs);
    } catch (err) {
      console.error(err);
    }
  }

  getRegStatus(status: number): string {
    switch (status) {
      case 1:
        return 'Pending';
      case 2:
        return 'Confirmed';
      case 3:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }
}
