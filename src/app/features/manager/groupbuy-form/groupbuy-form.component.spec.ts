import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupBuyFormComponent } from './groupbuy-form.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('GroupBuyFormComponent', () => {
  let component: GroupBuyFormComponent;
  let fixture: ComponentFixture<GroupBuyFormComponent>;

  const mockGroupBuyService = {
    currentGroupBuy: signal(null),
    currentProducts: signal([]),
    isActionLoading: signal(false),
    actionError: signal<string | null>(null),
    loadProject: async () => {},
    createGroupBuy: async () => ({ id: 'test' }),
    updateProject: async () => {},
    addProduct: async () => {},
    listCategories: async () => [],
    listPriceTemplates: async () => [],
    getPriceTemplate: async () => null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupBuyFormComponent],
      providers: [{ provide: GroupBuyService, useValue: mockGroupBuyService }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupBuyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form initially', () => {
    expect(component.form.valid).toBeFalsy();
  });

  describe('calculateFinalPrice', () => {
    it('should floor by default (method=1, digit=0)', () => {
      component.form.patchValue({ exchangeRate: 4.5, roundingMethod: 1, roundingDigit: 0 });
      const prod = component.createProductGroup();
      prod.patchValue({ priceOriginal: 33 });
      // 33 * 4.5 = 148.5 → floor → 148
      expect(component.calculateFinalPrice(prod)).toBe(148);
    });

    it('should ceil (method=2, digit=0)', () => {
      component.form.patchValue({ exchangeRate: 4.5, roundingMethod: 2, roundingDigit: 0 });
      const prod = component.createProductGroup();
      prod.patchValue({ priceOriginal: 33 });
      // 33 * 4.5 = 148.5 → ceil → 149
      expect(component.calculateFinalPrice(prod)).toBe(149);
    });

    it('should round (method=3, digit=0)', () => {
      component.form.patchValue({ exchangeRate: 4.5, roundingMethod: 3, roundingDigit: 0 });
      const prod = component.createProductGroup();
      prod.patchValue({ priceOriginal: 33 });
      // 33 * 4.5 = 148.5 → round → 149
      expect(component.calculateFinalPrice(prod)).toBe(149);
    });

    it('should round to tens place (digit=1)', () => {
      component.form.patchValue({ exchangeRate: 4.5, roundingMethod: 1, roundingDigit: 1 });
      const prod = component.createProductGroup();
      prod.patchValue({ priceOriginal: 33 });
      // 33 * 4.5 = 148.5, div 10 = 14.85, floor = 14, * 10 = 140
      expect(component.calculateFinalPrice(prod)).toBe(140);
    });

    it('should use product exchange rate when set', () => {
      component.form.patchValue({ exchangeRate: 4.5, roundingMethod: 1, roundingDigit: 0 });
      const prod = component.createProductGroup();
      prod.patchValue({ priceOriginal: 100, exchangeRate: 2 });
      // 100 * 2 = 200
      expect(component.calculateFinalPrice(prod)).toBe(200);
    });
  });

  describe('form array management', () => {
    it('should add a product to the form array', () => {
      const before = component.products.length;
      component.addProduct();
      expect(component.products.length).toBe(before + 1);
    });

    it('should create spec group with defaults', () => {
      const spec = component.createSpecGroup();
      expect(spec.value.name).toBe('');
      expect(spec.value.id).toBe('');
    });

    it('should add shipping config', () => {
      const before = component.shippingConfigs.length;
      component.addShippingConfig();
      expect(component.shippingConfigs.length).toBe(before + 1);
    });
  });
  it('should call createGroupBuy with full payload on submit', () => {
    component.form.patchValue({
      title: 'Test GB',
      description: 'Description must be long enough',
      exchangeRate: 4.5,
      sourceCurrency: 'USD',
    });

    const spy = vi.spyOn(mockGroupBuyService, 'createGroupBuy');
    component.onSubmit();

    expect(spy).toHaveBeenCalledWith(
      'Test GB',
      'Description must be long enough',
      expect.any(Array), // products
      expect.any(String), // coverImage
      undefined, // deadline (or null/undefined)
      expect.any(Array), // shippingConfigs
      expect.any(Array), // managerIds
      4.5, // exchangeRate
      expect.anything(), // roundingConfig
      'USD', // sourceCurrency
    );
  });

  describe('template rendering', () => {
    it('should show "Create New Project" header in create mode', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Create New Project');
    });

    it('should show "Edit Project" header in edit mode', () => {
      component.isEditMode.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Edit Project');
    });

    it('should show title validation error when touched and empty', () => {
      const titleControl = component.form.get('title');
      titleControl?.markAsTouched();
      titleControl?.setValue('');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Title is required');
    });

    it('should show title minlength error', () => {
      const titleControl = component.form.get('title');
      titleControl?.markAsTouched();
      titleControl?.setValue('ab');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('at least 3 characters');
    });

    it('should show description validation errors', () => {
      const descControl = component.form.get('description');
      descControl?.markAsTouched();
      descControl?.setValue('');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Description is required');
    });

    it('should show "No products added yet" when products array is empty', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No products added yet.');
    });

    it('should render product card after adding one', () => {
      component.addProduct();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Product #1');
    });

    it('should show "No advanced shipping" when no shipping configs', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No advanced shipping configuration added.');
    });

    it('should render shipping config after adding one', () => {
      component.addShippingConfig();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Method Name');
    });

    it('should show Co-Managers section only in edit mode', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Co-Managers');

      component.isEditMode.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Co-Managers');
    });

    it('should show error message when actionError is set', () => {
      mockGroupBuyService.actionError.set('Something went wrong');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Something went wrong');
    });

    it('should show "Create Project" submit button in create mode', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Create Project');
    });

    it('should show "Save Changes" submit button in edit mode', () => {
      component.isEditMode.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Save Changes');
    });

    it('should show price configuration section with currency and rate', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Price Configuration');
      expect(fixture.nativeElement.textContent).toContain('Source Currency');
      expect(fixture.nativeElement.textContent).toContain('Exchange Rate');
    });

    it('should show price template modal when opened', () => {
      component.isPriceTemplateModalOpen.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Select Price Template');
    });

    it('should show template modal when opened', () => {
      component.isTemplateModalOpen.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Select Template');
    });

    it('should show manager modal when opened in edit mode', () => {
      component.isEditMode.set(true);
      component.isManagerModalOpen.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Manage Co-Managers');
    });

    it('should show "No templates available" when categories is empty', () => {
      component.isTemplateModalOpen.set(true);
      component.categories.set([]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No templates available.');
    });

    it('should show "No price templates available" when priceTemplates is empty', () => {
      component.isPriceTemplateModalOpen.set(true);
      component.priceTemplates.set([]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No price templates available.');
    });

    it('should render spec section when product is added', () => {
      component.addProduct();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Specifications / Variants');
    });

    it('should display calculated final price for product', () => {
      component.form.patchValue({ exchangeRate: 0.23, roundingMethod: 1, roundingDigit: 0 });
      const prodGroup = component.createProductGroup();
      prodGroup.patchValue({ priceOriginal: 1000 });
      component.products.push(prodGroup);
      fixture.detectChanges();
      // 1000 * 0.23 = 230, floor = 230
      expect(fixture.nativeElement.textContent).toContain('NT$');
    });
  });
});
