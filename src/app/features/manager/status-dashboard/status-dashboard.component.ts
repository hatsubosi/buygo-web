import { Component, inject, input, computed, effect, signal , ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { ManagerService } from '../../../core/manager/manager.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { OrderItemStatus } from '../../../core/api/api/v1/groupbuy_pb';

interface StatusCell {
    status: OrderItemStatus;
    count: number;
    specId: string; // Empty if no spec
}

interface StatusRow {
    productId: string;
    productName: string;
    specId: string;
    specName: string;
    cells: Record<number, StatusCell>; // key: status enum
}

@Component({
    selector: 'app-status-dashboard',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, UiContainerComponent, UiBtnComponent, FormsModule],
    template: `
    <div class="min-h-screen pt-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <app-ui-container customClass="p-8">
            <!-- Header -->
            <div class="mb-8 flex items-center justify-between">
                <div>
                   <div class="mb-2 flex items-center gap-2">
                        <a [routerLink]="['/manager/project', id()]" class="text-gray-400 hover:text-white flex items-center gap-1">
                            <span class="material-icons text-sm">arrow_back</span> Back to Project
                        </a>
                   </div>
                   <h2 class="text-2xl font-bold text-white">Fulfillment Dashboard</h2>
                   <p class="mt-2 text-gray-400">Track and update item status across the supply chain</p>
                </div>
            </div>

            <!-- Dashboard Matrix -->
            <div class="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                <table class="w-full text-left text-sm text-gray-400">
                    <thead class="bg-black/40 uppercase text-xs text-gray-500">
                         <tr>
                             <th class="px-4 py-3 sticky left-0 bg-[#0a0a0a] z-10">Product / Spec</th>
                             <th class="px-4 py-3 text-center">Unordered</th>
                             <th class="px-4 py-3 text-center">Ordered</th>
                             <th class="px-4 py-3 text-center">Overseas</th>
                             <th class="px-4 py-3 text-center">Domestic</th>
                             <th class="px-4 py-3 text-center">Ready</th>
                             <th class="px-4 py-3 text-center">Sent</th>
                         </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        @for (row of matrix(); track row.productId + row.specId) {
                        <tr class="hover:bg-white/5 transition-colors">
                            <td class="px-4 py-3 font-medium text-white sticky left-0 bg-[#0a0a0a] z-10 border-r border-white/5">
                                <div>{{ row.productName }}</div>
                                <div class="text-xs text-gray-500">{{ row.specName }}</div>
                            </td>
                            
                            <!-- Unordered (1) -> Ordered (2) -->
                            <td class="px-4 py-3 text-center border-r border-white/5 cursor-pointer hover:bg-white/10" 
                                (click)="openDialog(row, 2, 1)">
                                <span class="block font-bold" [class.text-white]="row.cells[1].count > 0">{{ row.cells[1].count }}</span>
                            </td>

                            <!-- Ordered (2) -> Overseas (3) -->
                             <td class="px-4 py-3 text-center border-r border-white/5 cursor-pointer hover:bg-white/10" 
                                (click)="openDialog(row, 3, 2)">
                                <span class="block font-bold" [class.text-blue-400]="row.cells[2].count > 0">{{ row.cells[2].count }}</span>
                            </td>

                            <!-- Overseas (3) -> Domestic (4) -->
                             <td class="px-4 py-3 text-center border-r border-white/5 cursor-pointer hover:bg-white/10" 
                                (click)="openDialog(row, 4, 3)">
                                <span class="block font-bold" [class.text-indigo-400]="row.cells[3].count > 0">{{ row.cells[3].count }}</span>
                            </td>

                            <!-- Domestic (4) -> Ready (5) -->
                             <td class="px-4 py-3 text-center border-r border-white/5 cursor-pointer hover:bg-white/10" 
                                (click)="openDialog(row, 5, 4)">
                                <span class="block font-bold" [class.text-purple-400]="row.cells[4].count > 0">{{ row.cells[4].count }}</span>
                            </td>

                            <!-- Ready (5) -> Sent (6) (DISABLED for Batch) -->
                             <td class="px-4 py-3 text-center border-r border-white/5 cursor-not-allowed bg-white/5" 
                                title="Ship individual orders in Order List">
                                <span class="block font-bold" [class.text-green-400]="row.cells[5].count > 0">{{ row.cells[5].count }}</span>
                            </td>

                            <!-- Sent (6) -->
                             <td class="px-4 py-3 text-center">
                                <span class="block font-bold" [class.text-green-600]="row.cells[6].count > 0" [class.text-gray-500]="row.cells[6].count === 0">{{ row.cells[6].count }}</span>
                            </td>
                        </tr>
                        }
                        @if (matrix().length === 0) {
                        <tr>
                            <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                                No items found.
                            </td>
                        </tr>
                        }
                    </tbody>
                </table>
            </div>

            <!-- Move Dialog -->
            @if (selectedAction) {
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                 <div class="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-xl p-6 shadow-2xl animate-scale-in" (click)="$event.stopPropagation()">
                     <h3 class="text-xl font-bold text-white mb-4">Update Status</h3>
                     <p class="text-gray-300 mb-6">
                        Move items from <span class="font-bold text-white">{{ getStatusLabel(selectedAction!.fromStatus) }}</span> 
                        to <span class="font-bold text-white">{{ getStatusLabel(selectedAction!.targetStatus) }}</span>
                     </p>
                     
                     <div class="mb-6">
                        <label class="block text-sm text-gray-400 mb-2">Quantity (Max {{ selectedAction!.maxCount }})</label>
                        <input type="number" [(ngModel)]="moveCount" min="1" [max]="selectedAction!.maxCount"
                               class="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white focus:border-blue-500 outline-none">
                     </div>

                     <div class="flex justify-end gap-3">
                        <app-ui-btn variant="ghost" (onClick)="closeDialog()">Cancel</app-ui-btn>
                        <app-ui-btn variant="primary" (onClick)="confirmAction()" [loading]="isLoading">
                            Confirm Move
                        </app-ui-btn>
                     </div>
                 </div>
            </div>
            }

        </app-ui-container>
    </div>
    `
})
export class StatusDashboardComponent {
    groupBuyService = inject(GroupBuyService);
    managerService = inject(ManagerService);
    toast = inject(ToastService);
    id = input<string>(); // Project ID

    products = this.groupBuyService.currentProducts;
    orders = this.managerService.orders;

    // Computed Matrix
    matrix = computed(() => {
        const prods = this.products();
        const orders = this.orders();
        if (!prods.length) return [];

        // Build Rows from Products/Specs
        const rows: StatusRow[] = [];

        prods.forEach(p => {
            if (p.specs.length > 0) {
                p.specs.forEach(s => {
                    rows.push(this.createEmptyRow(p.id, p.name, s.id, s.name));
                });
            } else {
                rows.push(this.createEmptyRow(p.id, p.name, '', 'Default'));
            }
        });

        // Populate Counts
        orders.forEach(o => {
            // Filter invalid?
            if (o.paymentStatus === 4) return; // Ignore Rejected orders? Or keep them? Usually ignore.

            o.items.forEach(item => {
                // Determine item Spec ID
                const itemSpecId = item.specId || '';

                // Match row: Handle potentially undefined/null specId
                const row = rows.find(r => r.productId === item.productId && r.specId === itemSpecId);

                if (row) {
                    const status = item.status || 1; // Default to Unordered
                    if (row.cells[status]) {
                        row.cells[status].count += item.quantity;
                    } else {
                        console.warn('DEBUG: Cell not found for status:', status, 'in row:', row.productName);
                    }
                } else {
                    // Only warn if we really can't find it (maybe product deleted?)
                    console.warn('Row not found for item:', item.productName, item.specName, 'PID:', item.productId, 'SID:', itemSpecId);
                }
            });
        });

        return rows;
    });

    // Dialog State
    selectedAction: { row: StatusRow, targetStatus: number, fromStatus: number, maxCount: number } | null = null;
    moveCount = 1;
    isLoading = false;

    constructor() {
        effect(() => {
            const id = this.id();
            if (id) {
                this.groupBuyService.loadGroupBuy(id);
                this.managerService.loadGroupBuyOrders(id);
            }
        });
    }

    createEmptyRow(pid: string, pname: string, sid: string, sname: string): StatusRow {
        const cells: Record<number, StatusCell> = {};
        for (let i = 1; i <= 7; i++) {
            cells[i] = { status: i, count: 0, specId: sid };
        }
        return {
            productId: pid, productName: pname, specId: sid, specName: sname, cells
        };
    }

    getStatusLabel(status: number): string {
        switch (status) {
            case 1: return 'Unordered';
            case 2: return 'Ordered';
            case 3: return 'Arrived Overseas';
            case 4: return 'Arrived Domestic';
            case 5: return 'Ready for Pickup';
            case 6: return 'Sent';
            case 7: return 'Failed/Cancelled';
            default: return 'Unknown';
        }
    }

    openDialog(row: StatusRow, targetStatus: number, fromStatus: number) {
        const count = row.cells[fromStatus].count;
        if (count === 0) return; // Cannot move 0 items

        this.selectedAction = {
            row,
            targetStatus,
            fromStatus,
            maxCount: count
        };
        this.moveCount = count; // Default to moving all
    }

    closeDialog() {
        this.selectedAction = null;
    }

    async confirmAction() {
        if (!this.selectedAction) return;

        this.isLoading = true;
        try {
            await this.managerService.batchUpdateStatus(
                this.id()!,
                this.selectedAction.row.specId,
                this.selectedAction.targetStatus,
                this.moveCount
            );
            // Reload
            await this.managerService.loadGroupBuyOrders(this.id()!);
            this.closeDialog();
            this.toast.show('Status updated successfully', 'success');
        } catch (err: any) {
            this.toast.show(err.message || 'Failed to update status', 'error');
        } finally {
            this.isLoading = false;
        }
    }
}
