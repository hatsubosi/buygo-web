import {
  Component,
  inject,
  signal,
  OnInit,
  Input,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { UiDialogComponent } from '../../../shared/ui/ui-dialog/ui-dialog.component';
import { ManagerSelectorComponent } from '../components/manager-selector/manager-selector.component';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../core/event/event.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { Event } from '../../../core/api/api/v1/event_pb';

@Component({
  selector: 'app-event-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    UiContainerComponent,
    UiBtnComponent,
    UiDialogComponent,
    ManagerSelectorComponent,
  ],
  providers: [DatePipe], // For formatting date inputs

  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.css',
})
export class EventFormComponent implements OnInit {
  eventService = inject(EventService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  datePipe = inject(DatePipe);

  // ViewChild for dialog might be better, but for now standard injection or @ViewChild in class
  @ViewChild(UiDialogComponent) dialog!: UiDialogComponent;

  eventId = signal<string | null>(null);
  isEditMode = signal<boolean>(false);
  isManagerModalOpen = signal(false);

  openManagerModal() {
    this.isManagerModalOpen.set(true);
  }

  closeManagerModal() {
    this.isManagerModalOpen.set(false);
  }

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    location: [''],
    coverImageUrl: [''],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    allowModification: [false],

    items: this.fb.array([]),
    discounts: this.fb.array([]),
    managerIds: [[]],
  });

  get items() {
    return this.form.get('items') as FormArray;
  }

  get discounts() {
    return this.form.get('discounts') as FormArray;
  }

  get managerIdsControl() {
    return this.form.get('managerIds')!;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    // Check if route is 'create', 'new' or has ID.
    // Our route likely is 'event/create' or 'event/edit/:id' or 'event/:id/edit'.
    // Let's assume the router config sends optional ID.
    if (id && id !== 'create') {
      this.eventId.set(id);
      this.isEditMode.set(true);
      this.loadEventData(id);
    }
  }

  async loadEventData(id: string) {
    // Load event
    await this.eventService.loadEvent(id);
    const event = this.eventService.currentEvent();
    if (event) {
      // Populate form
      this.form.patchValue({
        title: event.title,
        description: event.description,
        location: event.location,
        coverImageUrl: event.coverImageUrl,
        startTime: this.formatDate(event.startTime?.toDate()),
        endTime: this.formatDate(event.endTime?.toDate()),
        allowModification: event.allowModification,
        managerIds: event.managers ? event.managers.map((u: any) => u.id) : [],
      });

      // Populate Items
      this.items.clear();
      event.items.forEach((item) => {
        this.items.push(this.createItemGroup(item));
      });

      // Populate Discounts
      this.discounts.clear();
      event.discounts.forEach((d: any) => {
        this.discounts.push(this.createDiscountGroup(d));
      });
    }
  }

  createItemGroup(item?: any): FormGroup {
    return this.fb.group({
      id: [item?.id || ''], // Hidden ID
      name: [item?.name || '', Validators.required],
      price: [Number(item?.price) || 0],
      minParticipants: [item?.minParticipants || 0],
      maxParticipants: [item?.maxParticipants || 0],
      startTime: [item?.startTime ? this.formatDate(item.startTime.toDate()) : ''],
      endTime: [item?.endTime ? this.formatDate(item.endTime.toDate()) : ''],
      allowMultiple: [item?.allowMultiple ?? true],
    });
  }

  addItem() {
    this.items.push(this.createItemGroup());
  }

  createDiscountGroup(discount?: any): FormGroup {
    return this.fb.group({
      minQuantity: [discount?.minQuantity || 0, [Validators.required, Validators.min(1)]],
      minDistinctItems: [discount?.minDistinctItems || 0, [Validators.min(0)]],
      discountAmount: [
        Number(discount?.discountAmount) || 0,
        [Validators.required, Validators.min(0)],
      ],
    });
  }

  addDiscount() {
    this.discounts.push(this.createDiscountGroup());
  }

  removeDiscount(index: number) {
    this.discounts.removeAt(index);
  }

  async confirmRemoveItem(index: number) {
    const confirmed = await this.dialog.open({
      title: 'Remove Item',
      message: 'Are you sure you want to remove this item? This cannot be undone.',
      type: 'destructive',
      confirmText: 'Remove',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      this.removeItem(index);
    }
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    // datetime-local needs yyyy-MM-ddTHH:mm
    return this.datePipe.transform(date, 'yyyy-MM-ddTHH:mm') || '';
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const start = new Date(val.startTime);
    const end = new Date(val.endTime);

    try {
      if (this.isEditMode() && this.eventId()) {
        await this.eventService.updateEvent(this.eventId()!, {
          title: val.title,
          description: val.description,
          location: val.location,
          coverImageUrl: val.coverImageUrl,
          allowModification: val.allowModification,
          startTime: val.startTime,
          endTime: val.endTime,

          items: val.items,
          managerIds: val.managerIds,
          discounts: val.discounts,
        });
      } else {
        await this.eventService.createEvent(
          val.title,
          val.description,
          start,
          end,
          val.items,
          val.discounts,
        );
        // Note: Create doesn't support items yet in frontend service createEvent method
        // OR likely backend CreateEvent doesn't support items yet?
        // Backend CreateEvent only takes basic fields.
        // We might need to split creation: Create -> Then Update with items?
        // Or update CreateEvent RPC.
        // For now, MVP: Create only basic, then User edits to add items.
        // Let's warn user or redirect to edit.
      }
      // Redirect to detail page after update/create
      if (this.isEditMode() && this.eventId()) {
        this.router.navigate(['/manager/event', this.eventId()]);
      } else {
        this.router.navigate(['/manager']);
      }
    } catch (err) {
      // Error handled by service signal
    }
  }
}
