import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupBuyListComponent } from './groupbuy-list.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { AuthService } from '../../../core/auth/auth.service';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { GroupBuyStatus } from '../../../core/api/api/v1/groupbuy_pb';

describe('GroupBuyListComponent', () => {
  let component: GroupBuyListComponent;
  let fixture: ComponentFixture<GroupBuyListComponent>;
  let router: Router;

  const mockGroupBuyService = {
    groupBuys: signal([]),
    isLoadingList: signal(false),
    loadGroupBuys: () => {},
  };

  const mockAuthService = {
    user: signal(null),
    isAuthenticated: () => false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupBuyListComponent],
      providers: [
        { provide: GroupBuyService, useValue: mockGroupBuyService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupBuyListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct status labels', () => {
    expect(component.getStatusLabel(GroupBuyStatus.ACTIVE)).toBe('Active');
    expect(component.getStatusLabel(GroupBuyStatus.DRAFT)).toBe('Draft');
    expect(component.getStatusLabel(GroupBuyStatus.ENDED)).toBe('Ended');
    expect(component.getStatusLabel(GroupBuyStatus.ARCHIVED)).toBe('Archived');
    expect(component.getStatusLabel(99 as GroupBuyStatus)).toBe('Unknown');
  });

  it('should navigate to project detail', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.openProject('proj-123');
    expect(navigateSpy).toHaveBeenCalledWith(['/groupbuy', 'proj-123']);
  });

  it('should paginate groupbuys', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const projects = Array.from({ length: 10 }).map((_, i) => ({ id: `p-${i}`, title: `P${i}` }));
    mockGroupBuyService.groupBuys.set(projects as any);
    fixture.detectChanges();

    expect(component.totalPages()).toBe(2);
    expect(component.pagedGroupBuys().length).toBe(9);
    component.nextPage();
    expect(component.page()).toBe(2);
    expect(component.pagedGroupBuys().length).toBe(1);
    component.prevPage();
    expect(component.page()).toBe(1);
    expect(navigateSpy).toHaveBeenCalled();
    const lastCall = navigateSpy.mock.calls.at(-1)!;
    expect(lastCall[0]).toEqual([]);
    expect((lastCall[1] as any)?.queryParams?.page).toBe(1);
  });
});
