import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectFormComponent } from './project-form.component';
import { ProjectService } from '../../../core/project/project.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('ProjectFormComponent', () => {
    let component: ProjectFormComponent;
    let fixture: ComponentFixture<ProjectFormComponent>;

    const mockProjectService = {
        currentProject: signal(null),
        currentProducts: signal([]),
        isActionLoading: signal(false),
        actionError: signal(null),
        loadProject: async () => { },
        createProject: async () => ({ id: 'test' }),
        updateProject: async () => { },
        addProduct: async () => { },
        listCategories: async () => [],
        listPriceTemplates: async () => [],
        getPriceTemplate: async () => null
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProjectFormComponent],
            providers: [
                { provide: ProjectService, useValue: mockProjectService },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ProjectFormComponent);
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
});
