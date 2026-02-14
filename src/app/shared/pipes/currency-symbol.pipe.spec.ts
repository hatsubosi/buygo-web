import { CurrencySymbolPipe } from './currency-symbol.pipe';

describe('CurrencySymbolPipe', () => {
    let pipe: CurrencySymbolPipe;

    beforeEach(() => {
        pipe = new CurrencySymbolPipe();
    });

    it('should create', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return ¥ for JPY', () => {
        expect(pipe.transform('JPY')).toBe('¥');
    });

    it('should return $ for USD', () => {
        expect(pipe.transform('USD')).toBe('$');
    });

    it('should return NT$ for TWD', () => {
        expect(pipe.transform('TWD')).toBe('NT$');
    });

    it('should return ¥ for CNY', () => {
        expect(pipe.transform('CNY')).toBe('¥');
    });

    it('should return ₩ for KRW', () => {
        expect(pipe.transform('KRW')).toBe('₩');
    });

    it('should return € for EUR', () => {
        expect(pipe.transform('EUR')).toBe('€');
    });

    it('should return £ for GBP', () => {
        expect(pipe.transform('GBP')).toBe('£');
    });

    it('should be case-insensitive', () => {
        expect(pipe.transform('jpy')).toBe('¥');
        expect(pipe.transform('usd')).toBe('$');
    });

    it('should return the code itself for unknown currencies', () => {
        expect(pipe.transform('XYZ')).toBe('XYZ');
        expect(pipe.transform('BTC')).toBe('BTC');
    });

    it('should return empty string for null', () => {
        expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
        expect(pipe.transform(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
        expect(pipe.transform('')).toBe('');
    });
});
