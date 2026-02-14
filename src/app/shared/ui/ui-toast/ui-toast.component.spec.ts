import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiToastComponent } from './ui-toast.component';
import { ToastService } from './toast.service';

describe('UiToastComponent', () => {
    let component: UiToastComponent;
    let fixture: ComponentFixture<UiToastComponent>;
    let toastService: ToastService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiToastComponent]
        }).compileComponents();

        toastService = TestBed.inject(ToastService);
        fixture = TestBed.createComponent(UiToastComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display toast messages from service', () => {
        toastService.show('Test message', 'success');
        expect(toastService.toasts().length).toBe(1);
        expect(toastService.toasts()[0].message).toBe('Test message');
    });
});
