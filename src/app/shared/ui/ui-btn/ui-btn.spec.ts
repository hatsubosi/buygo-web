import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiBtnComponent } from './ui-btn.component';

describe('UiBtnComponent', () => {
  let component: UiBtnComponent;
  let fixture: ComponentFixture<UiBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiBtnComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UiBtnComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return primary variant classes by default', () => {
    expect(component.getVariantClasses()).toContain('from-blue-600');
  });

  it('should return danger variant classes', () => {
    fixture.componentRef.setInput('variant', 'danger');
    expect(component.getVariantClasses()).toContain('from-red-600');
  });

  it('should return ghost variant classes', () => {
    fixture.componentRef.setInput('variant', 'ghost');
    expect(component.getVariantClasses()).toContain('text-gray-400');
  });
});
