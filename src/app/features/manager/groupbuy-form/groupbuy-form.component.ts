import { Component, inject, input, effect, signal, computed, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ManagerSelectorComponent } from '../components/manager-selector/manager-selector.component';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { UiDialogComponent } from '../../../shared/ui/ui-dialog/ui-dialog.component';
import { Product, ProductSpec, RoundingConfig, RoundingMethod, ShippingConfig, ShippingType, Category, PriceTemplate } from '../../../core/api/api/v1/groupbuy_pb';

@Component({
    selector: 'app-project-form',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, RouterLink, UiContainerComponent, UiBtnComponent, UiDialogComponent, ManagerSelectorComponent, DecimalPipe],
    templateUrl: './groupbuy-form.component.html',
    styleUrl: './groupbuy-form.component.css'
})
export class GroupBuyFormComponent {
    groupBuyService = inject(GroupBuyService);
    fb = inject(FormBuilder);
    router = inject(Router);

    @ViewChild(UiDialogComponent) dialog!: UiDialogComponent;

    id = input<string>(); // Router param for Edit Mode
    isEditMode = signal(false);

    backLink = computed(() => this.isEditMode() ? ['/manager/project', this.id()] : ['/manager']);

    form: FormGroup = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        description: ['', [Validators.required, Validators.minLength(10)]],
        coverImage: [''],
        deadline: [''],
        sourceCurrency: ['JPY', [Validators.required]],
        exchangeRate: [0.23, [Validators.required, Validators.min(0)]],
        roundingMethod: [1, [Validators.required]],
        roundingDigit: [0, [Validators.required]],

        products: this.fb.array([]),
        shippingConfigs: this.fb.array([]),
        managerIds: [[]] // Array of strings
    });

    get products() {
        return this.form.get('products') as FormArray;
    }

    get shippingConfigs() {
        return this.form.get('shippingConfigs') as FormArray;
    }

    getSpecs(prod: any): FormArray { // helper for template typing
        return prod.get('specs') as FormArray;
    }

    get managerIdsControl() {
        return this.form.get('managerIds')!;
    }

    categories = signal<Category[]>([]);
    priceTemplates = signal<PriceTemplate[]>([]);

    constructor() {
        this.loadCategories(); // Load templates
        this.loadPriceTemplates();

        // Check if Edit Mode
        effect(() => {
            const projectId = this.id();
            if (projectId) {
                this.isEditMode.set(true);
                this.groupBuyService.loadGroupBuy(projectId);
            }
        }, { allowSignalWrites: true });





        // ... existing code ...

        // Populate Form when Project Loaded (Edit Mode)
        effect(() => {
            if (this.isEditMode()) {
                const p = this.groupBuyService.currentGroupBuy();
                const products = this.groupBuyService.currentProducts();

                if (p && p.id === this.id()) {
                    let deadlineStr = '';
                    if (p.deadline) {
                        const d = p.deadline.toDate();
                        // Format for datetime-local: YYYY-MM-DDThh:mm
                        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                        deadlineStr = d.toISOString().slice(0, 16);
                    }

                    this.form.patchValue({
                        title: p.title,
                        description: p.description,

                        coverImage: p.coverImageUrl,
                        deadline: deadlineStr,
                        sourceCurrency: p.sourceCurrency || 'JPY',
                        exchangeRate: p.exchangeRate || 0.23,
                        roundingMethod: p.roundingConfig?.method || 1,
                        roundingDigit: p.roundingConfig?.digit || 0,

                        managerIds: p.managers ? p.managers.map(u => u.id) : []
                    });

                    // Clear existing shipping configs
                    this.shippingConfigs.clear();
                    if (p.shippingConfigs && p.shippingConfigs.length > 0) {
                        p.shippingConfigs.forEach(c => this.shippingConfigs.push(this.createShippingConfigGroup(c)));
                    }

                    this.form.get('title')?.enable();
                    this.form.get('description')?.enable();
                }

                if (products && products.length > 0 && this.products.length === 0) {
                    products.forEach(prod => {
                        this.products.push(this.createProductGroup(prod));
                    });
                }
            }
        });

    }

    async loadCategories() {
        try {
            const cats = await this.groupBuyService.listCategories();
            this.categories.set(cats);
        } catch (e) {
            console.error('Failed to load categories', e);
        }
    }

    async loadPriceTemplates() {
        try {
            const list = await this.groupBuyService.listPriceTemplates();
            this.priceTemplates.set(list);
        } catch (e) {
            console.error('Failed to load price templates', e);
        }
    }

    applyPriceTemplate(id: string) {
        if (!id) return;
        const t = this.priceTemplates().find(x => x.id === id);
        if (t) {
            this.form.patchValue({
                sourceCurrency: t.sourceCurrency,
                exchangeRate: t.exchangeRate,
                roundingMethod: t.roundingConfig?.method || 1,
                roundingDigit: t.roundingConfig?.digit || 0
            });
        }
    }

    // Template Modal State
    isTemplateModalOpen = signal(false);
    currentProductForTemplate: any = null; // Store which product to apply template to

    openTemplateModal(prodCtrl: any) {
        this.currentProductForTemplate = prodCtrl;
        this.isTemplateModalOpen.set(true);
    }

    closeTemplateModal() {
        this.isTemplateModalOpen.set(false);
        this.currentProductForTemplate = null;
    }

    applyTemplate(categoryId: string) {
        if (!categoryId || !this.currentProductForTemplate) return;
        const cat = this.categories().find(c => c.id === categoryId);
        if (!cat) return;

        const specsArray = this.currentProductForTemplate.get('specs') as FormArray;
        cat.specNames.forEach((name: string) => {
            specsArray.push(this.createSpecGroup({ name } as any));
        });

        this.closeTemplateModal();
    }

    // Price Template Modal State
    isPriceTemplateModalOpen = signal(false);

    openPriceTemplateModal() {
        this.isPriceTemplateModalOpen.set(true);
    }

    closePriceTemplateModal() {
        this.isPriceTemplateModalOpen.set(false);
    }

    applyPriceTemplateFromModal(id: string) {
        this.applyPriceTemplate(id); // Reuse existing logic
        this.closePriceTemplateModal();
    }

    // Manager Modal State
    isManagerModalOpen = signal(false);

    openManagerModal() {
        this.isManagerModalOpen.set(true);
    }

    closeManagerModal() {
        this.isManagerModalOpen.set(false);
    }

    private submitted = false;

    constructor_effect = effect(() => {
        const loading = this.groupBuyService.isActionLoading();
        const error = this.groupBuyService.actionError();

        if (this.submitted && !loading && !error) {
            if (this.isEditMode()) {
                this.router.navigate(['/manager/project', this.id()]);
            } else {
                this.router.navigate(['/manager']);
            }
            this.submitted = false; // Reset
        } else if (this.submitted && !loading && error) {
            this.submitted = false; // Reset on error so user can try again
        }
    });

    createProductGroup(prod?: Product): FormGroup {
        const specsArray = this.fb.array<FormGroup>([]);
        if (prod && prod.specs) {
            prod.specs.forEach(s => specsArray.push(this.createSpecGroup(s)));
        }

        return this.fb.group({
            id: [prod?.id || ''],
            name: [prod?.name || '', Validators.required],
            description: [prod?.description || ''],
            imageUrl: [prod?.imageUrl || ''],
            maxQuantity: [prod?.maxQuantity || 0],
            priceOriginal: [Number(prod?.priceOriginal) || 0, [Validators.required, Validators.min(0)]],
            exchangeRate: [prod?.exchangeRate || null, [Validators.min(0)]], // Allow null for default
            specs: specsArray
        });
    }

    createSpecGroup(spec?: ProductSpec): FormGroup {
        return this.fb.group({
            id: [spec?.id || ''],
            name: [spec?.name || '', Validators.required]
        });
    }

    createShippingConfigGroup(config?: ShippingConfig): FormGroup {
        return this.fb.group({
            id: [config?.id || ''],
            name: [config?.name || '', Validators.required],
            type: [config?.type || 1, Validators.required],
            price: [Number(config?.price) || 0, [Validators.required, Validators.min(0)]]
        });
    }

    addShippingConfig() {
        this.shippingConfigs.push(this.createShippingConfigGroup());
    }

    removeShippingConfig(index: number) {
        this.shippingConfigs.removeAt(index);
    }

    addProduct() {
        this.products.push(this.createProductGroup());
    }

    async confirmRemoveProduct(index: number) {
        const confirmed = await this.dialog.open({
            title: 'Remove Product',
            message: 'Are you sure you want to remove this product? This cannot be undone.',
            type: 'destructive',
            confirmText: 'Remove',
            cancelText: 'Cancel'
        });
        if (confirmed) {
            this.products.removeAt(index);
        }
    }

    addSpec(prodCtrl: any) { // prodCtrl is AbstractControl
        (prodCtrl.get('specs') as FormArray).push(this.createSpecGroup());
    }

    removeSpec(prodCtrl: any, index: number) {
        (prodCtrl.get('specs') as FormArray).removeAt(index);
    }


    calculateFinalPrice(prod: any): number {
        const priceOriginal = prod.get('priceOriginal')?.value || 0;
        let rate = prod.get('exchangeRate')?.value;
        if (!rate || rate === 0) {
            rate = this.form.get('exchangeRate')?.value || 0;
        }

        // Rounding
        const method = this.form.get('roundingMethod')?.value || 1; // 1=Floor
        const digit = this.form.get('roundingDigit')?.value || 0; // 0=Ones

        let val = priceOriginal * rate;
        const pow = Math.pow(10, digit);
        val = val / pow;

        switch (method) {
            case 2: val = Math.ceil(val); break;
            case 3: val = Math.round(val); break;
            default: val = Math.floor(val); break;
        }

        val = val * pow;
        return val;
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitted = true;
        const val = this.form.value;

        // Map Form Products to Proto Products
        const productsList: Product[] = val.products.map((p: any) => {
            const specs = p.specs.map((s: any) => new ProductSpec({ id: s.id, name: s.name }));

            // Calculate Final Price locally strictly? Or trust backend?
            // Trust backend mostly, but frontend form preview should match.
            // We only send exchangeRate/original, backend does calculation.
            // BUT if we want to display it correctly now, helper is enough.

            return new Product({
                id: p.id,
                name: p.name,
                description: p.description,
                imageUrl: p.imageUrl,
                maxQuantity: p.maxQuantity,
                priceOriginal: BigInt(p.priceOriginal),
                exchangeRate: Number(p.exchangeRate),
                specs: specs
            });
        });

        const shippingConfigsList: ShippingConfig[] = val.shippingConfigs.map((c: any) => new ShippingConfig({
            id: c.id,
            name: c.name,
            type: Number(c.type) as ShippingType,
            price: BigInt(c.price)
        }));

        if (this.isEditMode()) {
            const projectId = this.id();
            if (projectId) {
                const deadline = val.deadline ? new Date(val.deadline) : undefined;
                const managerIds = val.managerIds || [];
                const currentStatus = this.groupBuyService.currentGroupBuy()?.status || 1;

                const roundingConfig = new RoundingConfig({
                    method: Number(val.roundingMethod) as RoundingMethod,
                    digit: Number(val.roundingDigit)
                });

                this.groupBuyService.updateGroupBuy(
                    projectId,
                    val.title,
                    val.description,
                    currentStatus,
                    productsList,
                    val.coverImage,
                    deadline,
                    shippingConfigsList,
                    managerIds,
                    Number(val.exchangeRate),
                    roundingConfig,
                    val.sourceCurrency
                );
            }
        } else {
            this.groupBuyService.createGroupBuy(val.title, val.description);
            // We can't set currency/rate during createProject yet (API limits creation to title/desc usually)
            // But wait, user requirement says "Update Project Entity". 
            // If CreateProjectRequest only has title/desc, we can't set it initially.
            // Assuming "CreateProject" creates draft, then we update it?
            // Actually, CreateProject usually returns the project.
            // If the user wants to set this info immediately, we probably need to Update it immediately after creating?
            // Or maybe CreateProjectRequest needs update?
        }
    }
}
