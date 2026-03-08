import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryManagementComponent } from './category-management.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';

describe('CategoryManagementComponent', () => {
  let component: CategoryManagementComponent;
  let fixture: ComponentFixture<CategoryManagementComponent>;

  const mockGroupBuyService = {
    listCategories: async () => [],
    createCategory: async () => undefined,
    listPriceTemplates: async () => [],
    createPriceTemplate: async () => undefined,
    updatePriceTemplate: async () => undefined,
    deletePriceTemplate: async () => undefined,
  };

  const mockToastService = {
    show: () => undefined,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryManagementComponent],
      providers: [
        { provide: GroupBuyService, useValue: mockGroupBuyService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Use detectChanges instead of whenStable for better signal support
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty categories', () => {
    expect(component.categories()).toEqual([]);
  });

  it('should have an invalid form initially', () => {
    expect(component.form.valid).toBe(false);
  });
});
