import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderConfirmationComponent } from './order-confirmation.component';
import { ProjectService } from '../../../core/project/project.service';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('OrderConfirmationComponent', () => {
    let component: OrderConfirmationComponent;
    let fixture: ComponentFixture<OrderConfirmationComponent>;
    let router: Router;

    const mockProjectService = {
        currentProject: signal(null),
        lastCreatedOrderId: signal(null),
        loadProject: async () => { }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OrderConfirmationComponent],
            providers: [
                { provide: ProjectService, useValue: mockProjectService },
                provideRouter([
                    { path: 'project/:id', component: OrderConfirmationComponent },
                    { path: 'user/orders/:id', component: OrderConfirmationComponent },
                    { path: 'user/orders', component: OrderConfirmationComponent },
                    { path: '**', component: OrderConfirmationComponent },
                ])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(OrderConfirmationComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        vi.spyOn(router, 'navigate');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to order detail when viewOrder is called', () => {
        component.orderId = 'order-123';
        component.viewOrder();
        expect(router.navigate).toHaveBeenCalledWith(['/user/orders', 'order-123']);
    });

    it('should navigate to project when backToProject is called', () => {
        component.projectId = 'proj-1';
        component.backToProject();
        expect(router.navigate).toHaveBeenCalledWith(['project', 'proj-1']);
    });

    it('should navigate home when backToProject has no projectId', () => {
        component.projectId = null;
        component.backToProject();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
});
