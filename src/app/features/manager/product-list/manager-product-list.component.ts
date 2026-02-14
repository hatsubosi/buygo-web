import { Component, inject, input, effect, signal , ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';

@Component({
    selector: 'app-manager-product-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, RouterLink, UiContainerComponent, UiBtnComponent],
    template: `
    <div class="min-h-screen pt-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <app-ui-container customClass="p-8">
        <!-- Header -->
        <div class="mb-8 flex items-center justify-between">
          <div>
            <div class="mb-2 flex items-center gap-2">
                <a [routerLink]="['/manager/project', id()]" class="text-gray-400 hover:text-white">
                    <span class="material-icons text-sm">arrow_back</span> Back to Project
                </a>
            </div>
            <h1 class="text-3xl font-bold text-white">Manage Products</h1>
            <p class="mt-2 text-gray-400">Add and manage products for this project</p>
          </div>
          <app-ui-btn variant="primary" (click)="toggleForm()">
            <span class="material-icons text-sm mr-2">{{ showForm() ? 'remove' : 'add' }}</span>
            {{ showForm() ? 'Cancel' : 'Add Product' }}
          </app-ui-btn>
        </div>

        <!-- Add Product Form -->
         @if (showForm()) {
            <div class="mb-8 rounded-xl border border-white/10 bg-white/5 p-6 animate-in slide-in-from-top-4 fade-in">
                <h3 class="mb-4 text-lg font-bold text-white">Add New Product</h3>
                <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
                            <input type="text" formControlName="name" placeholder="e.g. Keycaps Set A"
                                class="block w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Original Price (JPY)</label>
                            <input type="number" formControlName="priceOriginal" placeholder="e.g. 1500"
                                class="block w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Exchange Rate</label>
                            <input type="number" formControlName="exchangeRate" placeholder="e.g. 0.0075" step="0.0001"
                                class="block w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        </div>
                         <!-- Specs -->
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Specifications (Variants)</label>
                            <div formArrayName="specs" class="space-y-2">
                                @for (spec of specs.controls; track spec; let i = $index) {
                                    <div class="flex gap-2">
                                        <input [formControlName]="i" type="text" placeholder="Option Name"
                                            class="block w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                        <button type="button" (click)="removeSpec(i)" class="text-red-400 hover:text-red-300">
                                            <span class="material-icons">delete</span>
                                        </button>
                                    </div>
                                }
                            </div>
                            <button type="button" (click)="addSpec()" class="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center">
                                <span class="material-icons text-sm mr-1">add</span> Add Variant
                            </button>
                        </div>
                    </div>

                    <!-- Error -->
                     @if (groupBuyService.actionError()) {
                        <p class="text-sm text-red-500">{{ groupBuyService.actionError() }}</p>
                     }

                    <div class="flex justify-end pt-2">
                        <app-ui-btn variant="primary" type="submit" [loading]="groupBuyService.isActionLoading()" [disabled]="form.invalid">
                            Save Product
                        </app-ui-btn>
                    </div>
                </form>
            </div>
         }

        <!-- Product List -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (product of products(); track product.id) {
                <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div class="mb-2 flex items-start justify-between">
                        <h3 class="font-bold text-white">{{ product.name }}</h3>
                        <span class="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">{{ product.id.substring(0,6) }}</span>
                    </div>
                    <div class="text-sm text-gray-400 space-y-1">
                        <p>Original: {{ product.priceOriginal }}</p>
                        <p>Final: {{ product.priceFinal }}</p>
                        <p>Specs: {{ product.specs.length }} variants</p>
                    </div>
                </div>
            }
            @if (products().length === 0) {
                <div class="col-span-full py-12 text-center text-gray-500">
                    No products added yet.
                </div>
            }
        </div>

      </app-ui-container>
    </div>
  `
})
export class ManagerProductListComponent {
    groupBuyService = inject(GroupBuyService);
    fb = inject(FormBuilder);

    id = input<string>(); // Project ID

    showForm = signal(false);

    products = this.groupBuyService.currentProducts;

    form: FormGroup = this.fb.group({
        name: ['', Validators.required],
        priceOriginal: ['', [Validators.required, Validators.min(0)]],
        exchangeRate: [1.0, [Validators.required, Validators.min(0.000001)]],
        specs: this.fb.array([this.fb.control('', Validators.required)])
    });

    get specs() {
        return this.form.get('specs') as FormArray;
    }

    addSpec() {
        this.specs.push(this.fb.control('', Validators.required));
    }

    removeSpec(index: number) {
        this.specs.removeAt(index);
    }

    constructor() {
        // Load project if needed? 
        // We assume we are navigating here so we should ensure project details (and products) are loaded.
        effect(() => {
            const pid = this.id();
            if (pid && !this.groupBuyService.currentGroupBuy()) {
                this.groupBuyService.loadGroupBuy(pid);
            }
        }, { allowSignalWrites: true });

        // Reset form on success
        effect(() => {
            if (!this.groupBuyService.isActionLoading() && !this.groupBuyService.actionError() && this.showForm() && this.submitted) {
                this.showForm.set(false);
                this.form.reset({ exchangeRate: 1.0 });
                this.specs.clear();
                this.addSpec();
                this.submitted = false;
            }
        }, { allowSignalWrites: true });
    }

    toggleForm() {
        this.showForm.update(v => !v);
    }

    submitted = false;

    onSubmit() {
        if (this.form.invalid) return;
        this.submitted = true;
        const val = this.form.value;
        const projectId = this.id();
        if (projectId) {
            this.groupBuyService.addProduct(
                projectId,
                val.name,
                val.priceOriginal,
                val.exchangeRate,
                val.specs as string[]
            );
        }
    }
}
