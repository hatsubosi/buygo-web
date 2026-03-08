import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ManagerGroupBuyDetailComponent } from './manager-groupbuy-detail.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ManagerService } from '../../../core/manager/manager.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { UserRole } from '../../../core/api/api/v1/auth_pb';

describe('ManagerGroupBuyDetailComponent', () => {
  let component: ManagerGroupBuyDetailComponent;
  let fixture: ComponentFixture<ManagerGroupBuyDetailComponent>;
  let router: Router;

  let mockGroupBuyService: any;
  let mockManagerService: any;
  let mockToastService: any;
  let mockAuthService: any;

  function createMocks() {
    mockGroupBuyService = {
      currentGroupBuy: signal<any>(null),
      currentProducts: signal<any[]>([]),
      loadGroupBuy: vi.fn().mockResolvedValue(undefined),
      updateGroupBuy: vi.fn().mockResolvedValue(undefined),
    };
    mockAuthService = {
      user: signal<any>(null),
    };
    mockManagerService = {
      orders: signal<any[]>([]),
      loadGroupBuyOrders: vi.fn().mockResolvedValue(undefined),
    };
    mockToastService = {
      show: vi.fn(),
    };
  }

  beforeEach(async () => {
    createMocks();

    await TestBed.configureTestingModule({
      imports: [ManagerGroupBuyDetailComponent],
      providers: [
        { provide: GroupBuyService, useValue: mockGroupBuyService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ManagerService, useValue: mockManagerService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([{ path: '**', component: ManagerGroupBuyDetailComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerGroupBuyDetailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── getProjectStatus ──────────────────────────────────────────

  describe('getProjectStatus', () => {
    it('should return correct label for known statuses', () => {
      expect(component.getProjectStatus(1)).toBe('Draft');
      expect(component.getProjectStatus(2)).toBe('Active');
      expect(component.getProjectStatus(3)).toBe('Ended');
      expect(component.getProjectStatus(4)).toBe('Archived');
    });

    it('should return Unknown for unmapped status', () => {
      expect(component.getProjectStatus(99)).toBe('Unknown');
      expect(component.getProjectStatus(0)).toBe('Unknown');
    });
  });

  // ── toDate ────────────────────────────────────────────────────

  describe('toDate', () => {
    it('should convert Timestamp to Date', () => {
      const mockTs = { toDate: () => new Date('2026-01-01') };
      expect(component.toDate(mockTs)).toEqual(new Date('2026-01-01'));
    });

    it('should return null for falsy input', () => {
      expect(component.toDate(null)).toBeNull();
      expect(component.toDate(undefined)).toBeNull();
    });
  });

  // ── validOrders computed ──────────────────────────────────────

  describe('validOrders', () => {
    it('should filter out cancelled orders (paymentStatus=4)', () => {
      mockManagerService.orders.set([
        { id: 'o1', paymentStatus: 1, items: [] },
        { id: 'o2', paymentStatus: 4, items: [] },
        { id: 'o3', paymentStatus: 2, items: [] },
      ]);

      expect(component.validOrders()).toHaveLength(2);
      expect(component.validOrders().map((o: any) => o.id)).toEqual(['o1', 'o3']);
    });

    it('should return empty array when no orders', () => {
      mockManagerService.orders.set([]);
      expect(component.validOrders()).toEqual([]);
    });
  });

  describe('validOrdersCount', () => {
    it('should return count of valid orders', () => {
      mockManagerService.orders.set([
        { id: 'o1', paymentStatus: 1, items: [] },
        { id: 'o2', paymentStatus: 4, items: [] },
      ]);

      expect(component.validOrdersCount()).toBe(1);
    });
  });

  // ── salesStats computed ───────────────────────────────────────

  describe('salesStats', () => {
    it('should aggregate order items into sales stats per product', () => {
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'Product A', priceOriginal: BigInt(100), exchangeRate: BigInt(30) },
        { id: 'p2', name: 'Product B', priceOriginal: BigInt(200), exchangeRate: BigInt(30) },
      ]);
      mockManagerService.orders.set([
        {
          id: 'o1',
          paymentStatus: 1,
          items: [
            { productId: 'p1', quantity: 2 },
            { productId: 'p2', quantity: 1 },
          ],
        },
        {
          id: 'o2',
          paymentStatus: 1,
          items: [{ productId: 'p1', quantity: 3 }],
        },
      ]);

      const stats = component.salesStats();
      expect(stats).toHaveLength(2);
      // p1: quantity=5, revenueOriginal=100*5=500, revenueConverted=100*30*5=15000
      const p1 = stats.find((s: any) => s.id === 'p1');
      expect(p1?.quantity).toBe(5);
      expect(p1?.revenueOriginal).toBe(500);
      expect(p1?.revenueConverted).toBe(15000);
      // p2: quantity=1, revenueOriginal=200*1=200, revenueConverted=200*30*1=6000
      const p2 = stats.find((s: any) => s.id === 'p2');
      expect(p2?.quantity).toBe(1);
      expect(p2?.revenueOriginal).toBe(200);
    });

    it('should sort by revenueConverted descending', () => {
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'Cheap', priceOriginal: BigInt(10), exchangeRate: BigInt(1) },
        { id: 'p2', name: 'Expensive', priceOriginal: BigInt(1000), exchangeRate: BigInt(1) },
      ]);
      mockManagerService.orders.set([
        {
          id: 'o1',
          paymentStatus: 1,
          items: [
            { productId: 'p1', quantity: 1 },
            { productId: 'p2', quantity: 1 },
          ],
        },
      ]);

      const stats = component.salesStats();
      expect(stats[0].id).toBe('p2');
      expect(stats[1].id).toBe('p1');
    });

    it('should return empty array when no products', () => {
      mockGroupBuyService.currentProducts.set([]);
      mockManagerService.orders.set([{ id: 'o1', paymentStatus: 1, items: [] }]);

      expect(component.salesStats()).toEqual([]);
    });

    it('should exclude cancelled orders from stats', () => {
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'Product A', priceOriginal: BigInt(100), exchangeRate: BigInt(1) },
      ]);
      mockManagerService.orders.set([
        { id: 'o1', paymentStatus: 1, items: [{ productId: 'p1', quantity: 2 }] },
        { id: 'o2', paymentStatus: 4, items: [{ productId: 'p1', quantity: 10 }] }, // cancelled
      ]);

      const stats = component.salesStats();
      expect(stats[0].quantity).toBe(2); // cancelled order excluded
    });
  });

  // ── financialStats computed ───────────────────────────────────

  describe('financialStats', () => {
    it('should sum up totals from salesStats', () => {
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'A', priceOriginal: BigInt(100), exchangeRate: BigInt(2) },
        { id: 'p2', name: 'B', priceOriginal: BigInt(50), exchangeRate: BigInt(2) },
      ]);
      mockManagerService.orders.set([
        {
          id: 'o1',
          paymentStatus: 1,
          items: [
            { productId: 'p1', quantity: 3 },
            { productId: 'p2', quantity: 2 },
          ],
        },
      ]);

      const fin = component.financialStats();
      // p1: 100*3=300, p2: 50*2=100 => totalOriginal=400
      expect(fin.totalOriginal).toBe(400);
      // p1: 100*2*3=600, p2: 50*2*2=200 => totalConverted=800
      expect(fin.totalConverted).toBe(800);
    });

    it('should return zeros when no products', () => {
      mockGroupBuyService.currentProducts.set([]);
      expect(component.financialStats()).toEqual({ totalOriginal: 0, totalConverted: 0 });
    });
  });

  // ── updateStatus ──────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should do nothing if project is null', async () => {
      mockGroupBuyService.currentGroupBuy.set(null);
      await component.updateStatus(2);
      expect(mockGroupBuyService.updateGroupBuy).not.toHaveBeenCalled();
    });

    it('should do nothing for any status', async () => {
      mockGroupBuyService.currentGroupBuy.set({ id: 'p1', title: 'T', description: 'D' });
      await component.updateStatus(99);
      expect(mockGroupBuyService.updateGroupBuy).not.toHaveBeenCalled();
    });

    it('should call updateGroupBuy and show toast after dialog confirmation', async () => {
      const project = {
        id: 'p1',
        title: 'My Project',
        description: 'Desc',
        coverImageUrl: 'img.png',
        deadline: { toDate: () => new Date('2026-06-01') },
        shippingConfigs: [{ id: 's1' }],
      };
      mockGroupBuyService.currentGroupBuy.set(project);
      mockGroupBuyService.currentProducts.set([{ id: 'prod1' }]);

      // Mock dialog to confirm
      component.dialog = { open: vi.fn().mockResolvedValue(true) } as any;

      await component.updateStatus(2);

      expect(component.dialog.open).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Confirm publish',
          message: 'Are you sure you want to publish this project?',
        }),
      );
      expect(mockGroupBuyService.updateGroupBuy).toHaveBeenCalledWith(
        'p1',
        'My Project',
        'Desc',
        2,
        [{ id: 'prod1' }],
        'img.png',
        new Date('2026-06-01'),
        [{ id: 's1' }],
      );
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Project status updated to publish',
        'success',
      );
    });

    it('should not call updateGroupBuy if dialog is cancelled', async () => {
      mockGroupBuyService.currentGroupBuy.set({ id: 'p1' });
      component.dialog = { open: vi.fn().mockResolvedValue(false) } as any;

      await component.updateStatus(3);

      expect(mockGroupBuyService.updateGroupBuy).not.toHaveBeenCalled();
      expect(mockToastService.show).not.toHaveBeenCalled();
    });

    it('should use destructive dialog type for end (3) and archive (4)', async () => {
      mockGroupBuyService.currentGroupBuy.set({ id: 'p1', shippingConfigs: [] });
      mockGroupBuyService.currentProducts.set([]);
      component.dialog = { open: vi.fn().mockResolvedValue(true) } as any;

      await component.updateStatus(3);
      expect(component.dialog.open).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'destructive' }),
      );

      (component.dialog.open as any).mockClear();
      await component.updateStatus(4);
      expect(component.dialog.open).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'destructive' }),
      );
    });

    it('should use default dialog type for publish (2)', async () => {
      mockGroupBuyService.currentGroupBuy.set({ id: 'p1', shippingConfigs: [] });
      mockGroupBuyService.currentProducts.set([]);
      component.dialog = { open: vi.fn().mockResolvedValue(true) } as any;

      await component.updateStatus(2);
      expect(component.dialog.open).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'default' }),
      );
    });
  });

  // ── access control effect ─────────────────────────────────────

  describe('access control effect', () => {
    it('should redirect non-creator non-manager users to /manager', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      mockAuthService.user.set({ id: 'user-99', role: UserRole.CREATOR });
      mockGroupBuyService.currentGroupBuy.set({
        id: 'p1',
        creator: { id: 'other-user' },
        managers: [{ id: 'manager-1' }],
      });

      TestBed.flushEffects();

      expect(navigateSpy).toHaveBeenCalledWith(['/manager']);
    });

    it('should not redirect if user is the creator', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      mockAuthService.user.set({ id: 'user-1', role: UserRole.CREATOR });
      mockGroupBuyService.currentGroupBuy.set({
        id: 'p1',
        creator: { id: 'user-1' },
        managers: [],
      });

      TestBed.flushEffects();

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should not redirect if user is a manager', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      mockAuthService.user.set({ id: 'user-5', role: UserRole.CREATOR });
      mockGroupBuyService.currentGroupBuy.set({
        id: 'p1',
        creator: { id: 'other' },
        managers: [{ id: 'user-5' }],
      });

      TestBed.flushEffects();

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should not redirect SYS_ADMIN even if not creator or manager', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      mockAuthService.user.set({ id: 'admin-1', role: UserRole.SYS_ADMIN });
      mockGroupBuyService.currentGroupBuy.set({
        id: 'p1',
        creator: { id: 'other' },
        managers: [],
      });

      TestBed.flushEffects();

      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  // ── load effect ───────────────────────────────────────────────

  describe('load effect', () => {
    it('should call loadGroupBuy and loadGroupBuyOrders when id is set', () => {
      fixture.componentRef.setInput('id', 'proj-42');
      TestBed.flushEffects();

      expect(mockGroupBuyService.loadGroupBuy).toHaveBeenCalledWith('proj-42');
      expect(mockManagerService.loadGroupBuyOrders).toHaveBeenCalledWith('proj-42');
    });
  });
});
