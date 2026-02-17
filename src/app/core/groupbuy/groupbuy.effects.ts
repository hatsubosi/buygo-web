import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { switchMap, map, catchError, of } from 'rxjs';
import { Timestamp } from '@bufbuild/protobuf';
import { GroupBuyActions } from './groupbuy.actions';
import { TransportToken } from '../providers/transport.token';
import { createPromiseClient } from '@connectrpc/connect';
import { GroupBuyService as ProjectRpcService } from '../api/api/v1/groupbuy_connect';
import {
  GetGroupBuyResponse,
  CreateOrderResponse,
  CreateOrderItem,
  CreateGroupBuyResponse,
  UpdateGroupBuyResponse,
  AddProductResponse,
  RoundingConfig,
  RoundingMethod,
  GetMyOrdersResponse,
  UpdateOrderResponse,
  UpdatePaymentInfoResponse,
} from '../api/api/v1/groupbuy_pb';

@Injectable()
export class GroupBuyEffects {
  private actions$ = inject(Actions);
  private transport = inject(TransportToken);
  private client = createPromiseClient(ProjectRpcService, this.transport);
  private readonly pageSize = 100;

  private async listAllGroupBuys() {
    const all = [];
    let pageToken = '';

    for (;;) {
      const res = await this.client.listGroupBuys({ pageSize: this.pageSize, pageToken });
      all.push(...res.groupBuys);
      if (!res.nextPageToken) break;
      pageToken = res.nextPageToken;
    }

    return all;
  }

  loadGroupBuys$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GroupBuyActions.loadGroupBuys),
      switchMap(() =>
        this.listAllGroupBuys()
          .then((groupBuys) => GroupBuyActions.loadGroupBuysSuccess({ groupBuys }))
          .catch((err: any) => GroupBuyActions.loadGroupBuysFailure({ error: err.message })),
      ),
    ),
  );

  loadGroupBuyDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GroupBuyActions.loadGroupBuyDetail),
      switchMap(({ id }) =>
        this.client
          .getGroupBuy({ groupBuyId: id })
          .then((res: GetGroupBuyResponse) => {
            if (!res.groupBuy) throw new Error('Project not found');
            return GroupBuyActions.loadGroupBuyDetailSuccess({
              groupBuy: res.groupBuy,
              products: res.products,
            });
          })
          .catch((err: any) => GroupBuyActions.loadGroupBuyDetailFailure({ error: err.message })),
      ),
    ),
  );

  submitOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GroupBuyActions.submitOrder),
      switchMap(({ groupBuyId, contactInfo, shippingAddress, items }) => {
        const orderItems = items.map(
          (item: any) =>
            new CreateOrderItem({
              productId: item.productId,
              specId: item.specId,
              quantity: item.quantity,
            }),
        );

        return this.client
          .createOrder({
            groupBuyId,
            contactInfo,
            shippingAddress,
            items: orderItems,
          })
          .then((res: CreateOrderResponse) =>
            GroupBuyActions.submitOrderSuccess({ orderId: res.orderId }),
          )
          .catch((err: any) => GroupBuyActions.submitOrderFailure({ error: err.message }));
      }),
    ),
  );

  createGroupBuy$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GroupBuyActions.createGroupBuy),
      switchMap(
        ({
          title,
          description,
          products,
          coverImage,
          deadline,
          shippingConfigs,
          managerIds,
          exchangeRate,
          roundingConfig,
          sourceCurrency,
        }) =>
          this.client
            .createGroupBuy({
              title,
              description,
              products,
              coverImageUrl: coverImage,
              deadline: deadline ? Timestamp.fromDate(deadline) : undefined,
              shippingConfigs,
              managerIds,
              exchangeRate,
              roundingConfig,
              sourceCurrency,
            })
            .then((res: CreateGroupBuyResponse) => {
              if (!res.groupBuy) throw new Error('No project returned');
              return GroupBuyActions.createGroupBuySuccess({ groupBuy: res.groupBuy });
            })
            .catch((err: any) => GroupBuyActions.createGroupBuyFailure({ error: err.message })),
      ),
    ),
  );

  updateGroupBuy$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GroupBuyActions.updateGroupBuy),
      switchMap(
        ({
          id,
          title,
          description,
          status,
          products,
          coverImage,
          deadline,
          shippingConfigs,
          managerIds,
          exchangeRate,
          roundingConfig,
          sourceCurrency,
        }) =>
          this.client
            .updateGroupBuy({
              groupBuyId: id,
              title,
              description,
              status,
              products,
              coverImageUrl: coverImage,
              deadline: deadline ? Timestamp.fromDate(deadline) : undefined,
              shippingConfigs,
              managerIds,
              exchangeRate,
              roundingConfig,
              sourceCurrency,
            })
            .then((res: UpdateGroupBuyResponse) => {
              if (!res.groupBuy) throw new Error('No project returned');
              return GroupBuyActions.updateGroupBuySuccess({ groupBuy: res.groupBuy });
            })
            .catch((err: any) => GroupBuyActions.updateGroupBuyFailure({ error: err.message })),
      ),
    ),
  );

  addProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GroupBuyActions.addProduct),
      switchMap(({ groupBuyId, name, priceOriginal, exchangeRate, specs }) =>
        this.client
          .addProduct({
            groupBuyId,
            name,
            priceOriginal: BigInt(priceOriginal),
            exchangeRate,
            specs,
            roundingConfig: new RoundingConfig({ method: RoundingMethod.CEIL, digit: 100 }), // Default rounding
          })
          .then((res: AddProductResponse) => {
            if (!res.product) throw new Error('No product returned');
            return GroupBuyActions.addProductSuccess({ product: res.product });
          })
          .catch((err: any) => GroupBuyActions.addProductFailure({ error: err.message })),
      ),
    ),
  );

  loadMyOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GroupBuyActions.loadMyOrders),
      switchMap(() =>
        this.client
          .getMyOrders({})
          .then((res: GetMyOrdersResponse) =>
            GroupBuyActions.loadMyOrdersSuccess({ orders: res.orders }),
          )
          .catch((err: any) => GroupBuyActions.loadMyOrdersFailure({ error: err.message })),
      ),
    ),
  );

  updateUserOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GroupBuyActions.updateUserOrder),
      switchMap(({ orderId, items, note }) => {
        const orderItems = items.map(
          (item: any) =>
            new CreateOrderItem({
              productId: item.productId,
              specId: item.specId,
              quantity: item.quantity,
            }),
        );
        return this.client
          .updateOrder({ orderId, items: orderItems, note })
          .then((res: UpdateOrderResponse) => {
            if (!res.order) throw new Error('No order returned');
            return GroupBuyActions.updateUserOrderSuccess({ order: res.order });
          })
          .catch((err: any) => GroupBuyActions.updateUserOrderFailure({ error: err.message }));
      }),
    ),
  );

  updatePaymentInfo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GroupBuyActions.updatePaymentInfo),
      switchMap(({ orderId, method, accountLast5 }) =>
        this.client
          .updatePaymentInfo({ orderId, method, accountLast5 })
          .then((res: UpdatePaymentInfoResponse) => {
            if (!res.order) throw new Error('No order returned');
            return GroupBuyActions.updatePaymentInfoSuccess({ order: res.order });
          })
          .catch((err: any) => GroupBuyActions.updatePaymentInfoFailure({ error: err.message })),
      ),
    ),
  );
}
