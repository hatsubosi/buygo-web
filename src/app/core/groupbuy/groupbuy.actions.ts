import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  GroupBuy,
  Product,
  Order,
  ShippingConfig,
  RoundingConfig,
} from '../api/api/v1/groupbuy_pb';

export interface CartItem {
  groupBuyId: string;
  productId: string;
  specId: string;
  quantity: number;
  productName: string;
  specName: string;
  price: number;
  maxQuantity: number;
}

export const GroupBuyActions = createActionGroup({
  source: 'GroupBuy',
  events: {
    'Load GroupBuys': emptyProps(),
    'Load GroupBuys Success': props<{ groupBuys: GroupBuy[] }>(),
    'Load GroupBuys Failure': props<{ error: string }>(),

    'Load GroupBuy Detail': props<{ id: string }>(),
    'Load GroupBuy Detail Success': props<{ groupBuy: GroupBuy; products: Product[] }>(),
    'Load GroupBuy Detail Failure': props<{ error: string }>(),

    // Create GroupBuy
    'Create GroupBuy': props<{
      title: string;
      description: string;
      products: Product[];
      coverImage: string;
      deadline?: Date;
      shippingConfigs: ShippingConfig[];
      managerIds: string[];
      exchangeRate: number;
      roundingConfig?: RoundingConfig;
      sourceCurrency: string;
    }>(),
    'Create GroupBuy Success': props<{ groupBuy: GroupBuy }>(),
    'Create GroupBuy Failure': props<{ error: string }>(),

    // Update GroupBuy
    'Update GroupBuy': props<{
      id: string;
      title: string;
      description: string;
      status: number;
      products: Product[];
      coverImage: string;
      deadline?: Date;

      shippingConfigs: ShippingConfig[];
      managerIds?: string[];
      exchangeRate?: number;
      roundingConfig?: RoundingConfig;
      sourceCurrency?: string;
    }>(),
    // Checking Proto: service ProjectService { rpc UpdateProject(UpdateProjectRequest) returns (UpdateGroupBuyResponse); }
    // message UpdateProjectRequest { string project_id = 1; ProjectStatus status = 2; }
    // Ah, it seems only status update is supported by the current API definition?
    // Let's stick to what's available or check if I need to update API.
    // User requested "Edit Project" (Title/Description). If API doesn't support it, I might need to mock or note it.
    // Re-reading task: "Form to create and update project details (Title, Description, Status)".
    // If API limits, I'll implement what IS possible (Status) and maybe Title/Desc if I missed it,
    // or just add the actions assuming I will update API later if needed.
    // Wait, let's check the API definition (project_service.go) I viewed earlier.
    // UpdateProject in Go only takes status.
    // CreateProject takes title/description.
    // So Edit might be limited to Status for now unless I update backend.
    // I will implement Update Project for status now.
    'Update GroupBuy Success': props<{ groupBuy: GroupBuy }>(),
    'Update GroupBuy Failure': props<{ error: string }>(),

    // Product Actions
    'Add Product': props<{
      groupBuyId: string;
      name: string;
      priceOriginal: number;
      exchangeRate: number;
      specs: string[];
    }>(),
    'Add Product Success': props<{ product: Product }>(),
    'Add Product Failure': props<{ error: string }>(),

    // Cart Actions
    'Add To Cart': props<{ item: CartItem }>(),
    'Remove From Cart': props<{ productId: string; specId: string }>(),
    'Update Cart Quantity': props<{ productId: string; specId: string; quantity: number }>(),
    'Clear Cart': emptyProps(),

    // User Order Actions
    'Load My Orders': emptyProps(),
    'Load My Orders Success': props<{ orders: Order[] }>(),
    'Load My Orders Failure': props<{ error: string }>(),

    'Update User Order': props<{ orderId: string; items: CartItem[]; note?: string }>(),
    'Update User Order Success': props<{ order: Order }>(),
    'Update User Order Failure': props<{ error: string }>(),

    'Update Payment Info': props<{ orderId: string; method: string; accountLast5: string }>(),
    'Update Payment Info Success': props<{ order: Order }>(),
    'Update Payment Info Failure': props<{ error: string }>(),

    // Order Actions
    'Submit Order': props<{
      groupBuyId: string;
      contactInfo: string;
      shippingAddress: string;
      shippingMethodId?: string;
      items: CartItem[];
    }>(),
    'Submit Order Success': props<{ orderId: string }>(),
    'Submit Order Failure': props<{ error: string }>(),
  },
});
