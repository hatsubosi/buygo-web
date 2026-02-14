import { Component, inject, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';

@Component({
  selector: 'app-order-confirmation',
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiContainerComponent, UiBtnComponent, RouterModule],
  template: `
    <div class="min-h-screen pb-20 pt-16 px-4 sm:px-8 flex items-center justify-center">
      <app-ui-container>
        <div class="p-12 text-center">
          <div class="mb-6 flex justify-center">
            <div class="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h2 class="text-3xl font-bold text-white mb-2">Order Confirmed!</h2>
          <p class="text-gray-400 mb-8">Thank you for your order. Your order ID is <br><span class="font-mono text-blue-400">{{ orderId }}</span></p>
          <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mb-8 max-w-lg mx-auto">
             <p class="text-blue-200 text-sm">
               <strong>Reminder:</strong> After completing your payment, please go to the Order Details page to update your payment information (Method, Amount, Date).
             </p>
           </div>
           
           <div class="flex justify-center gap-4">
             <app-ui-btn variant="secondary" (onClick)="viewOrder()">
               View Order Details
             </app-ui-btn>
             <app-ui-btn variant="primary" (onClick)="backToProject()">
               Back to Project
             </app-ui-btn>
           </div>
        </div>
      </app-ui-container>
    </div>
  `,
  styles: []
})
export class OrderConfirmationComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);

  projectId: string | null = null;
  orderId: string | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('id');
      this.orderId = params.get('orderId');
    });
  }

  backToProject() {
    if (this.projectId) {
      this.router.navigate(['project', this.projectId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  viewOrder() {
    if (this.orderId) {
      this.router.navigate(['/user/orders', this.orderId]);
    } else {
      this.router.navigate(['/user/orders']);
    }
  }
}
