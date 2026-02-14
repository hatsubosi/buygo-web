import { Component, inject, signal, ViewChild , ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { PriceTemplate, RoundingMethod, RoundingConfig } from '../../../core/api/api/v1/groupbuy_pb';

import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { UiDialogComponent } from '../../../shared/ui/ui-dialog/ui-dialog.component';

@Component({
    selector: 'app-price-template',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, UiContainerComponent, UiBtnComponent, UiDialogComponent],
    templateUrl: './price-template.component.html',
    styleUrl: './price-template.component.css'
})
export class PriceTemplateComponent {
    private groupBuyService = inject(GroupBuyService);
    private fb = inject(FormBuilder);

    @ViewChild(UiDialogComponent) dialog!: UiDialogComponent;

    templates = signal<PriceTemplate[]>([]);
    isLoading = signal(false);

    roundingMethods = [
        { value: RoundingMethod.FLOOR, label: 'Floor (Downgrade)' },
        { value: RoundingMethod.CEIL, label: 'Ceil (Upgrade)' },
        { value: RoundingMethod.ROUND, label: 'Round (Nearest)' },
    ];

    form = this.fb.group({
        name: ['', Validators.required],
        sourceCurrency: ['JPY', Validators.required],
        exchangeRate: [0.23, [Validators.required, Validators.min(0.000001)]],
        roundingMethod: [RoundingMethod.FLOOR, Validators.required],
        roundingDigit: [0, Validators.required]
    });

    constructor() {
        this.loadTemplates();
    }

    async loadTemplates() {
        this.isLoading.set(true);
        try {
            const list = await this.groupBuyService.listPriceTemplates();
            this.templates.set(list);
        } catch (err) {
            console.error(err);
        } finally {
            this.isLoading.set(false);
        }
    }

    async onSubmit() {
        if (this.form.invalid) return;

        const { name, sourceCurrency, exchangeRate, roundingMethod, roundingDigit } = this.form.value;

        if (!name || !sourceCurrency || exchangeRate === undefined || exchangeRate === null || roundingMethod === undefined || roundingDigit === undefined) return;

        this.isLoading.set(true);
        try {
            const rounding = new RoundingConfig({
                method: Number(roundingMethod),
                digit: Number(roundingDigit)
            });

            await this.groupBuyService.createPriceTemplate(name, sourceCurrency, exchangeRate, rounding);

            this.form.reset({
                name: '',
                sourceCurrency: 'JPY',
                exchangeRate: 1.0,
                roundingMethod: RoundingMethod.FLOOR,
                roundingDigit: 0
            });
            await this.loadTemplates();
            await this.loadTemplates();
        } catch (err) {
            await this.dialog.open({
                title: 'Error',
                message: 'Failed to create template. Please try again.',
                type: 'destructive',
                showCancel: false,
                confirmText: 'OK'
            });
            console.error(err);
        } finally {
            this.isLoading.set(false);
        }
    }

    async deleteTemplate(id: string) {
        const confirmed = await this.dialog.open({
            title: 'Delete Template',
            message: 'Are you sure you want to delete this template? This action cannot be undone.',
            type: 'destructive',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        this.isLoading.set(true);
        try {
            await this.groupBuyService.deletePriceTemplate(id);
            await this.loadTemplates();
        } catch (err) {
            await this.dialog.open({
                title: 'Error',
                message: 'Failed to delete template.',
                type: 'destructive',
                showCancel: false,
                confirmText: 'OK'
            });
            console.error(err);
        } finally {
            this.isLoading.set(false);
        }
    }
}
