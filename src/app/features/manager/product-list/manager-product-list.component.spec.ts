import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerProductListComponent } from './manager-product-list.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ComponentRef } from '@angular/core';

describe('ManagerProductListComponent', () => {
  let component: ManagerProductListComponent;
  let fixture: ComponentFixture<ManagerProductListComponent>;
  let componentRef: ComponentRef<ManagerProductListComponent>;

  const mockGroupBuyService = {
    currentGroupBuy: signal<any>(null),
    currentProducts: signal<any[]>([]),
    isActionLoading: signal(false),
    actionError: signal<string | null>(null),
    loadGroupBuy: vi.fn(),
    addProduct: vi.fn(),
  };

  beforeEach(async () => {
    // Reset signals before each test
    mockGroupBuyService.currentGroupBuy.set(null);
    mockGroupBuyService.currentProducts.set([]);
    mockGroupBuyService.isActionLoading.set(false);
    mockGroupBuyService.actionError.set(null);
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ManagerProductListComponent],
      providers: [{ provide: GroupBuyService, useValue: mockGroupBuyService }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerProductListComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── showForm toggle ──────────────────────────────────────────

  it('should not show add form initially', () => {
    expect(component.showForm()).toBe(false);
  });

  it('should toggle showForm to true when toggleForm is called', () => {
    component.toggleForm();
    expect(component.showForm()).toBe(true);
  });

  it('should toggle showForm back to false when toggleForm is called twice', () => {
    component.toggleForm();
    component.toggleForm();
    expect(component.showForm()).toBe(false);
  });

  // ── Form validation ──────────────────────────────────────────

  it('should have an invalid form initially (empty name)', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('should be valid when all required fields are filled', () => {
    component.form.patchValue({
      name: 'Test Product',
      priceOriginal: 1500,
      exchangeRate: 0.0075,
    });
    component.specs.at(0).setValue('Variant A');
    expect(component.form.valid).toBeTruthy();
  });

  it('should be invalid when priceOriginal is negative', () => {
    component.form.patchValue({
      name: 'Test Product',
      priceOriginal: -1,
      exchangeRate: 0.0075,
    });
    component.specs.at(0).setValue('Variant A');
    expect(component.form.valid).toBeFalsy();
  });

  it('should be invalid when exchangeRate is zero or below minimum', () => {
    component.form.patchValue({
      name: 'Test Product',
      priceOriginal: 1500,
      exchangeRate: 0,
    });
    component.specs.at(0).setValue('Variant A');
    expect(component.form.valid).toBeFalsy();
  });

  // ── Specs (FormArray) management ─────────────────────────────

  it('should start with one spec control', () => {
    expect(component.specs.length).toBe(1);
  });

  it('should add a spec control when addSpec is called', () => {
    component.addSpec();
    expect(component.specs.length).toBe(2);
  });

  it('should remove a spec control when removeSpec is called', () => {
    component.addSpec(); // now 2
    component.removeSpec(0);
    expect(component.specs.length).toBe(1);
  });

  it('should add multiple specs and remove specific index', () => {
    component.addSpec(); // index 1
    component.addSpec(); // index 2
    expect(component.specs.length).toBe(3);
    component.removeSpec(1);
    expect(component.specs.length).toBe(2);
  });

  // ── onSubmit ─────────────────────────────────────────────────

  it('should not call addProduct when form is invalid', () => {
    component.onSubmit();
    expect(mockGroupBuyService.addProduct).not.toHaveBeenCalled();
  });

  it('should not call addProduct when form is valid but no project id', () => {
    component.form.patchValue({
      name: 'Test Product',
      priceOriginal: 1500,
      exchangeRate: 0.0075,
    });
    component.specs.at(0).setValue('Variant A');
    // id() is undefined by default
    component.onSubmit();
    expect(mockGroupBuyService.addProduct).not.toHaveBeenCalled();
  });

  it('should call addProduct with correct arguments when form is valid and id is set', () => {
    componentRef.setInput('id', 'project-123');
    fixture.detectChanges();

    component.form.patchValue({
      name: 'Keycaps Set A',
      priceOriginal: 1500,
      exchangeRate: 0.0075,
    });
    component.specs.at(0).setValue('Red');

    component.onSubmit();

    expect(component.submitted).toBe(true);
    expect(mockGroupBuyService.addProduct).toHaveBeenCalledWith(
      'project-123',
      'Keycaps Set A',
      1500,
      0.0075,
      ['Red'],
    );
  });

  it('should call addProduct with multiple specs', () => {
    componentRef.setInput('id', 'project-456');
    fixture.detectChanges();

    component.form.patchValue({
      name: 'Switches',
      priceOriginal: 800,
      exchangeRate: 1.0,
    });
    component.specs.at(0).setValue('Linear');
    component.addSpec();
    component.specs.at(1).setValue('Tactile');

    component.onSubmit();

    expect(mockGroupBuyService.addProduct).toHaveBeenCalledWith(
      'project-456',
      'Switches',
      800,
      1.0,
      ['Linear', 'Tactile'],
    );
  });

  // ── Product list rendering ───────────────────────────────────

  it('should show "No products added yet." when products list is empty', () => {
    mockGroupBuyService.currentProducts.set([]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No products added yet.');
  });

  it('should render product cards when products are available', () => {
    mockGroupBuyService.currentProducts.set([
      {
        id: 'abc123def',
        name: 'Keycaps Set A',
        priceOriginal: 1500,
        priceFinal: 12,
        specs: ['Red', 'Blue'],
      },
      {
        id: 'xyz789ghi',
        name: 'Switches Pack',
        priceOriginal: 800,
        priceFinal: 6,
        specs: ['Linear'],
      },
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Keycaps Set A');
    expect(el.textContent).toContain('Switches Pack');
    expect(el.textContent).toContain('Original: 1500');
    expect(el.textContent).toContain('Final: 12');
    expect(el.textContent).toContain('2 variants');
    expect(el.textContent).toContain('1 variants');
    // Truncated id shown
    expect(el.textContent).toContain('abc123');
    expect(el.textContent).toContain('xyz789');
  });

  it('should not show empty message when products exist', () => {
    mockGroupBuyService.currentProducts.set([
      { id: 'abc123def', name: 'Test', priceOriginal: 100, priceFinal: 1, specs: [] },
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('No products added yet.');
  });

  // ── Form visibility in template ──────────────────────────────

  it('should show the form section when showForm is true', () => {
    component.toggleForm();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Add New Product');
    expect(el.textContent).toContain('Product Name');
  });

  it('should not show the form section when showForm is false', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Add New Product');
  });

  // ── Button text reflects form state ──────────────────────────

  it('should show "Add Product" button text when form is hidden', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Add Product');
  });

  it('should show "Cancel" button text when form is visible', () => {
    component.toggleForm();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Cancel');
  });

  // ── Error display ────────────────────────────────────────────

  it('should display action error when present and form is shown', () => {
    component.toggleForm();
    mockGroupBuyService.actionError.set('Something went wrong');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Something went wrong');
  });

  // ── Effect: load project when id is set ──────────────────────

  it('should call loadGroupBuy when id is set and currentGroupBuy is null', async () => {
    componentRef.setInput('id', 'project-abc');
    fixture.detectChanges();
    // Allow effects to run
    await fixture.whenStable();

    expect(mockGroupBuyService.loadGroupBuy).toHaveBeenCalledWith('project-abc');
  });

  it('should not call loadGroupBuy when currentGroupBuy already exists', async () => {
    mockGroupBuyService.currentGroupBuy.set({ id: 'project-abc', title: 'Existing' });
    componentRef.setInput('id', 'project-abc');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockGroupBuyService.loadGroupBuy).not.toHaveBeenCalled();
  });

  // ── Effect: reset form on success ────────────────────────────

  it('should reset form and hide it after successful submission', async () => {
    component.toggleForm();
    component.submitted = true;
    mockGroupBuyService.isActionLoading.set(false);
    mockGroupBuyService.actionError.set(null);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.showForm()).toBe(false);
    expect(component.submitted).toBe(false);
    expect(component.specs.length).toBe(1); // re-added one spec
    expect(component.form.value.exchangeRate).toBe(1.0);
  });

  it('should not reset form when action is still loading', () => {
    component.toggleForm();
    component.submitted = true;
    mockGroupBuyService.isActionLoading.set(true);
    mockGroupBuyService.actionError.set(null);
    fixture.detectChanges();

    expect(component.showForm()).toBe(true);
    expect(component.submitted).toBe(true);
  });

  it('should not reset form when there is an action error', () => {
    component.toggleForm();
    component.submitted = true;
    mockGroupBuyService.isActionLoading.set(false);
    mockGroupBuyService.actionError.set('Error occurred');
    fixture.detectChanges();

    expect(component.showForm()).toBe(true);
    expect(component.submitted).toBe(true);
  });

  it('should not reset form when submitted is false', () => {
    component.toggleForm();
    component.submitted = false;
    mockGroupBuyService.isActionLoading.set(false);
    mockGroupBuyService.actionError.set(null);
    fixture.detectChanges();

    // showForm stays true because submitted is false
    expect(component.showForm()).toBe(true);
  });
});
