import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiContainerComponent } from './ui-container.component';

describe('UiContainerComponent', () => {
  let component: UiContainerComponent;
  let fixture: ComponentFixture<UiContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiContainerComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UiContainerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
