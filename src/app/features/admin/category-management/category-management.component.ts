import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { Category } from '../../../core/api/api/v1/groupbuy_pb';

import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';

@Component({
  selector: 'app-category-management',
  imports: [ReactiveFormsModule, UiContainerComponent, UiBtnComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-management.component.html',
  styleUrl: './category-management.component.css',
})
export class CategoryManagementComponent {
  private groupBuyService = inject(GroupBuyService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  categories = signal<Category[]>([]);
  isLoading = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    specs: this.fb.array([]),
  });

  get specs() {
    return this.form.get('specs') as FormArray;
  }

  constructor() {
    this.loadCategories();
  }

  async loadCategories() {
    this.isLoading.set(true);
    try {
      const cats = await this.groupBuyService.listCategories();
      this.categories.set(cats);
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  addSpec() {
    this.specs.push(this.fb.control('', Validators.required));
  }

  removeSpec(index: number) {
    this.specs.removeAt(index);
  }

  async onSubmit() {
    if (this.form.invalid) return;

    const { name, specs } = this.form.value;
    if (!name) return;

    // Filter empty specs
    const validSpecs = ((specs as string[]) || []).filter((s) => s.trim() !== '');

    this.isLoading.set(true);
    try {
      await this.groupBuyService.createCategory(name, validSpecs);
      this.form.reset();
      this.specs.clear();
      await this.loadCategories();
      this.toast.show('Category created successfully', 'success');
    } catch (err) {
      this.toast.show('Failed to create category', 'error');
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }
}
