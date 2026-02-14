import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerProductListComponent } from './manager-product-list.component';
import { ProjectService } from '../../../core/project/project.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('ManagerProductListComponent', () => {
    let component: ManagerProductListComponent;
    let fixture: ComponentFixture<ManagerProductListComponent>;

    const mockProjectService = {
        currentProject: signal(null),
        currentProducts: signal([]),
        isActionLoading: signal(false),
        actionError: signal(null),
        loadProject: async () => { },
        addProduct: async () => { }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManagerProductListComponent],
            providers: [
                { provide: ProjectService, useValue: mockProjectService },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManagerProductListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not show add form initially', () => {
        expect(component.showForm()).toBe(false);
    });
});
