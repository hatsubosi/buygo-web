import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { vi } from 'vitest';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a toast on show', () => {
    service.show('Hello', 'success');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Hello');
    expect(service.toasts()[0].type).toBe('success');
  });

  it('should default to info type', () => {
    service.show('Info msg');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should remove toast by id', () => {
    service.show('First', 'info');
    service.show('Second', 'error');
    const firstId = service.toasts()[0].id;
    service.remove(firstId);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Second');
  });

  it('should auto-remove after timeout', () => {
    vi.useFakeTimers();
    service.show('Temp', 'success');
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(3000);
    expect(service.toasts().length).toBe(0);
    vi.useRealTimers();
  });
});
