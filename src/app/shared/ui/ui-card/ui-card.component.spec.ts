import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiCardComponent } from './ui-card.component';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({
    imports: [UiCardComponent],
    template: `
    <app-ui-card
      [title]="testTitle"
      [subtitle]="testSubtitle"
      [badgeText]="testBadge"
      [badgeClass]="testBadgeClass"
    >
      <div content id="test-content">Main Body Content</div>
      <div actions id="test-actions">
        <button>Action Button</button>
      </div>
    </app-ui-card>
  `,
})
class TestHostComponent {
    testTitle = 'Test Project';
    testSubtitle = 'Created Yesterday';
    testBadge = 'Active';
    testBadgeClass = 'bg-green-500/10 text-green-400';
}

describe('UiCardComponent', () => {
    let hostComponent: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        hostComponent = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should render the title correctly', () => {
        const titleEl = fixture.debugElement.query(By.css('[data-testid="ui-card-title"]'));
        expect(titleEl.nativeElement.textContent.trim()).toBe('Test Project');
    });

    it('should render the subtitle correctly', () => {
        const subtitleEl = fixture.debugElement.query(By.css('[data-testid="ui-card-subtitle"]'));
        expect(subtitleEl.nativeElement.textContent.trim()).toBe('Created Yesterday');
    });

    it('should render the badge text and apply the dynamic badge classes', () => {
        const badgeEl = fixture.debugElement.query(By.css('[data-testid="ui-card-badge"]'));
        expect(badgeEl.nativeElement.textContent.trim()).toBe('Active');
        // It should contain the classes we passed
        expect(badgeEl.nativeElement.className).toContain('bg-green-500/10');
        expect(badgeEl.nativeElement.className).toContain('text-green-400');
    });

    it('should project the main content in the correct slot', () => {
        // Look inside the card content wrapper for our projected div
        const contentWrapper = fixture.debugElement.query(By.css('[data-testid="ui-card-content"]'));
        const projectedContent = contentWrapper.query(By.css('#test-content'));
        expect(projectedContent).toBeTruthy();
        expect(projectedContent.nativeElement.textContent.trim()).toBe('Main Body Content');
    });

    it('should project the actions in the correct slot', () => {
        // Look inside the actions wrapper
        const actionsWrapper = fixture.debugElement.query(By.css('[data-testid="ui-card-actions"]'));
        const projectedAction = actionsWrapper.query(By.css('#test-actions'));
        expect(projectedAction).toBeTruthy();
        expect(projectedAction.nativeElement.textContent.trim()).toBe('Action Button');
    });
});
