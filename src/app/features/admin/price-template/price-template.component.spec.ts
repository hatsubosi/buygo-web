import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PriceTemplateComponent } from './price-template.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { signal } from '@angular/core';

describe('PriceTemplateComponent', () => {
    let component: PriceTemplateComponent;
    let fixture: ComponentFixture<PriceTemplateComponent>;

    const mockGroupBuyService = {
        listPriceTemplates: async () => [],
        createPriceTemplate: async () => { },
        updatePriceTemplate: async () => { },
        deletePriceTemplate: async () => { }
    };

    const mockToastService = {
        show: () => { }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PriceTemplateComponent],
            providers: [
                { provide: GroupBuyService, useValue: mockGroupBuyService },
                { provide: ToastService, useValue: mockToastService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PriceTemplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have an invalid form by default (name is required)', () => {
        expect(component.form.valid).toBeFalsy();
    });

    it('should have a valid form when name is provided', () => {
        component.form.patchValue({ name: 'Test Template' });
        expect(component.form.valid).toBeTruthy();
    });

    it('should be invalid when name is empty', () => {
        component.form.patchValue({ name: '' });
        expect(component.form.valid).toBeFalsy();
    });

    it('should be invalid when exchange rate is zero or negative', () => {
        component.form.patchValue({ exchangeRate: 0 });
        expect(component.form.controls.exchangeRate.valid).toBeFalsy();

        component.form.patchValue({ exchangeRate: -1 });
        expect(component.form.controls.exchangeRate.valid).toBeFalsy();
    });

    it('should have rounding methods defined', () => {
        expect(component.roundingMethods.length).toBe(3);
    });
});
