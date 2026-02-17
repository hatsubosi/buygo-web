import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiDialogComponent } from './ui-dialog.component';

describe('UiDialogComponent', () => {
  let component: UiDialogComponent;
  let fixture: ComponentFixture<UiDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve true on confirm', async () => {
    const promise = component.open({ title: 'Test', message: 'Body' });
    expect(component.isOpen()).toBe(true);
    expect(component.title()).toBe('Test');
    component.onConfirm();
    const result = await promise;
    expect(result).toBe(true);
    expect(component.isOpen()).toBe(false);
  });

  it('should resolve false on close', async () => {
    const promise = component.open({ title: 'T', message: 'M' });
    component.close();
    const result = await promise;
    expect(result).toBe(false);
  });

  it('should use default confirmText and showCancel', async () => {
    component.open({ title: 'T', message: 'M' });
    expect(component.confirmText()).toBe('Confirm');
    expect(component.showCancel()).toBe(true);
    component.close(); // cleanup
  });
});
