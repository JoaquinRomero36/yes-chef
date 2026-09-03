import { PaymentMethod } from '../models/order.models';

export const DELIVERY_FEE = 1500;

export interface PaymentOption {
  value: PaymentMethod;
  label: string;
}

export const PAYMENT_METHODS: PaymentOption[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'debit', label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'voucher', label: 'Vale / Cuenta' }
];

export const PAYMENT_METHODS_DELIVERY: PaymentOption[] =
  PAYMENT_METHODS.filter(m => m.value !== 'cash');

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return 'Sin registrar';
  const found = PAYMENT_METHODS.find(m => m.value === method);
  return found ? found.label : method;
}