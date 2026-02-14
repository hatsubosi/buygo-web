import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerSelectorComponent } from './manager-selector.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { signal } from '@angular/core';

describe('ManagerSelectorComponent', () => {
    let component: ManagerSelectorComponent;
    let fixture: ComponentFixture<ManagerSelectorComponent>;

    const mockAuthService = {
        listAssignableManagers: async () => ({ managers: [] })
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManagerSelectorComponent],
            providers: [
                { provide: AuthService, useValue: mockAuthService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManagerSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle selection', () => {
        component.toggleSelection('user-1');
        expect(component.isSelected('user-1')).toBe(true);
        component.toggleSelection('user-1');
        expect(component.isSelected('user-1')).toBe(false);
    });

    it('should support multiple selections', () => {
        component.toggleSelection('user-1');
        component.toggleSelection('user-2');
        expect(component.isSelected('user-1')).toBe(true);
        expect(component.isSelected('user-2')).toBe(true);
        expect(component.selectedIds()).toEqual(['user-1', 'user-2']);
    });

    it('should return false for non-selected user', () => {
        expect(component.isSelected('user-99')).toBe(false);
    });

    it('should initialize with empty managers', () => {
        expect(component.managers().length).toBe(0);
    });
});
