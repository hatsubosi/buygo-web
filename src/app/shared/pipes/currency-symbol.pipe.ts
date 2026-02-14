import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'currencySymbol'
})
export class CurrencySymbolPipe implements PipeTransform {

    private symbols: Record<string, string> = {
        'JPY': '¥',
        'USD': '$',
        'TWD': 'NT$',
        'CNY': '¥',
        'KRW': '₩',
        'EUR': '€',
        'GBP': '£'
        // Add more as needed
    };

    transform(value: string | undefined | null): string {
        if (!value) return '';
        return this.symbols[value.toUpperCase()] || value;
    }

}
