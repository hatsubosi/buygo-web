import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { switchMap, map, catchError, of } from 'rxjs';
import { Timestamp } from '@bufbuild/protobuf';
import { ProjectActions } from './project.actions';
import { TransportToken } from '../providers/transport.token';
import { createPromiseClient } from '@connectrpc/connect';
import { ProjectService as ProjectRpcService } from '../api/api/v1/project_connect';
import { ListProjectsResponse, GetProjectResponse, CreateOrderResponse, CreateOrderItem, CreateProjectResponse, UpdateProjectResponse, AddProductResponse, RoundingConfig, RoundingMethod, GetMyOrdersResponse, UpdateOrderResponse, UpdatePaymentInfoResponse } from '../api/api/v1/project_pb';

@Injectable()
export class ProjectEffects {
    private actions$ = inject(Actions);
    private transport = inject(TransportToken);
    private client = createPromiseClient(ProjectRpcService, this.transport);

    loadProjects$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProjectActions.loadProjects),
            switchMap(() =>
                this.client.listProjects({}).then(
                    (res: ListProjectsResponse) => ProjectActions.loadProjectsSuccess({ projects: res.projects })
                ).catch((err: any) => ProjectActions.loadProjectsFailure({ error: err.message }))
            )
        )
    );

    loadProjectDetail$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProjectActions.loadProjectDetail),
            switchMap(({ id }) =>
                this.client.getProject({ projectId: id }).then(
                    (res: GetProjectResponse) => {
                        if (!res.project) throw new Error('Project not found');
                        return ProjectActions.loadProjectDetailSuccess({ project: res.project, products: res.products });
                    }
                ).catch((err: any) => ProjectActions.loadProjectDetailFailure({ error: err.message }))
            )
        )
    );

    submitOrder$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProjectActions.submitOrder),
            switchMap(({ projectId, contactInfo, shippingAddress, items }) => {
                const orderItems = items.map(item => new CreateOrderItem({
                    productId: item.productId,
                    specId: item.specId,
                    quantity: item.quantity
                }));

                return this.client.createOrder({
                    projectId,
                    contactInfo,
                    shippingAddress,
                    items: orderItems
                }).then(
                    (res: CreateOrderResponse) => ProjectActions.submitOrderSuccess({ orderId: res.orderId })
                ).catch((err: any) => ProjectActions.submitOrderFailure({ error: err.message }))
            })
        )
    );

    createProject$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProjectActions.createProject),
            switchMap(({ title, description }) =>
                this.client.createProject({ title, description }).then(
                    (res: CreateProjectResponse) => {
                        if (!res.project) throw new Error('No project returned');
                        return ProjectActions.createProjectSuccess({ project: res.project });
                    }
                ).catch((err: any) => ProjectActions.createProjectFailure({ error: err.message }))
            )
        )
    );

    updateProject$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProjectActions.updateProject),
            switchMap(({ id, title, description, status, products, coverImage, deadline, shippingConfigs, managerIds, exchangeRate, roundingConfig, sourceCurrency }) =>
                this.client.updateProject({
                    projectId: id,
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
                    sourceCurrency
                }).then(
                    (res: UpdateProjectResponse) => {
                        if (!res.project) throw new Error('No project returned');
                        return ProjectActions.updateProjectSuccess({ project: res.project });
                    }
                ).catch((err: any) => ProjectActions.updateProjectFailure({ error: err.message }))
            )
        )
    );

    addProduct$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProjectActions.addProduct),
            switchMap(({ projectId, name, priceOriginal, exchangeRate, specs }) =>
                this.client.addProduct({
                    projectId,
                    name,
                    priceOriginal: BigInt(priceOriginal),
                    exchangeRate,
                    specs,
                    roundingConfig: new RoundingConfig({ method: RoundingMethod.CEIL, digit: 100 }) // Default rounding
                }).then(
                    (res: AddProductResponse) => {
                        if (!res.product) throw new Error('No product returned');
                        return ProjectActions.addProductSuccess({ product: res.product });
                    }
                ).catch((err: any) => ProjectActions.addProductFailure({ error: err.message }))
            )
        )
    );

    loadMyOrders$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProjectActions.loadMyOrders),
            switchMap(() =>
                this.client.getMyOrders({}).then(
                    (res: GetMyOrdersResponse) => ProjectActions.loadMyOrdersSuccess({ orders: res.orders })
                ).catch((err: any) => ProjectActions.loadMyOrdersFailure({ error: err.message }))
            )
        )
    );

    updateUserOrder$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProjectActions.updateUserOrder),
            switchMap(({ orderId, items, note }) => {
                const orderItems = items.map(item => new CreateOrderItem({
                    productId: item.productId,
                    specId: item.specId,
                    quantity: item.quantity
                }));
                return this.client.updateOrder({ orderId, items: orderItems, note }).then(
                    (res: UpdateOrderResponse) => {
                        if (!res.order) throw new Error('No order returned');
                        return ProjectActions.updateUserOrderSuccess({ order: res.order });
                    }
                ).catch((err: any) => ProjectActions.updateUserOrderFailure({ error: err.message }));
            })
        )
    );

    updatePaymentInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProjectActions.updatePaymentInfo),
            switchMap(({ orderId, method, accountLast5 }) =>
                this.client.updatePaymentInfo({ orderId, method, accountLast5 }).then(
                    (res: UpdatePaymentInfoResponse) => {
                        if (!res.order) throw new Error('No order returned');
                        return ProjectActions.updatePaymentInfoSuccess({ order: res.order });
                    }
                ).catch((err: any) => ProjectActions.updatePaymentInfoFailure({ error: err.message }))
            )
        )
    );
}
