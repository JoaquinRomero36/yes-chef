import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { Category } from '../../models/category.models';
import { Product } from '../../models/product.models';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CategoryWithProducts extends Category {
  products: Product[];
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <header class="bg-emerald-600 text-white p-4 sticky top-0 z-10 flex items-center justify-between">
        <h1 class="text-xl font-bold">YesChef</h1>
        @if (cart.length > 0) {
          <button (click)="showCart = true" class="bg-emerald-500 px-3 py-1 rounded-full text-sm font-medium relative">
            🛒 \${{ cartTotal().toFixed(2) }}
            <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {{ cart.length }}
            </span>
          </button>
        }
      </header>

      @if (!showCart) {
        <main class="flex-1 max-w-lg mx-auto p-4 w-full">
          @if (!tableNumber) {
            <div class="flex flex-col items-center justify-center h-64">
              <h2 class="text-lg font-semibold text-gray-700 mb-4">¿Mesa?</h2>
              <input type="number" [(ngModel)]="tableInput" placeholder="N° de mesa" min="1"
                class="w-32 text-center text-2xl px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none mb-4">
              <button (click)="setTable()"
                class="bg-emerald-600 text-white px-8 py-2 rounded-lg hover:bg-emerald-700 transition">
                Entrar
              </button>
            </div>
          } @else {
            @if (loading) {
              <p class="text-center text-gray-500 py-8">Cargando menú...</p>
            } @else {
              @for (cat of categoriesWithProducts; track cat.id) {
                <section class="mb-6">
                  <h2 class="text-lg font-semibold text-emerald-800 mb-3 border-b border-emerald-200 pb-1">
                    {{ cat.name }}
                  </h2>
                  @for (p of cat.products; track p.id) {
                    <div class="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                      <div class="flex-1">
                        <h3 class="font-medium text-gray-900">{{ p.name }}</h3>
                        @if (p.description) {
                          <p class="text-sm text-gray-500">{{ p.description }}</p>
                        }
                        <span class="text-emerald-700 font-semibold">\${{ p.price.toFixed(2) }}</span>
                      </div>
                      <button (click)="addToCart(p)"
                        class="ml-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm hover:bg-emerald-200 transition">
                        + Agregar
                      </button>
                    </div>
                  }
                </section>
              }
            }
          }
        </main>
      }

      @if (showCart && tableNumber) {
        <div class="flex-1 max-w-lg mx-auto p-4 w-full">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Tu pedido — Mesa {{ tableNumber }}</h2>

          @if (sent) {
            <div class="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4">
              ¡Pedido enviado a cocina!
            </div>
          }

          @if (error) {
            <div class="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4">{{ error }}</div>
          }

          @for (item of cart; track item.product.id) {
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <div class="flex-1">
                <p class="font-medium text-gray-900">{{ item.product.name }}</p>
                <p class="text-sm text-gray-500">\${{ (item.product.price * item.quantity).toFixed(2) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button (click)="updateQty(item.product.id, -1)" class="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300">−</button>
                <span class="w-6 text-center font-medium">{{ item.quantity }}</span>
                <button (click)="updateQty(item.product.id, 1)" class="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300">+</button>
              </div>
            </div>
          }

          <div class="mt-4 space-y-2">
            <div class="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>\${{ cartTotal().toFixed(2) }}</span>
            </div>
            <textarea [(ngModel)]="notes" placeholder="Notas para la cocina..." rows="2"
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
            <div class="flex gap-2">
              <button (click)="showCart = false" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                Seguir agregando
              </button>
              <button (click)="sendOrder()" [disabled]="sending"
                class="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
                {{ sending ? 'Enviando...' : 'Enviar a cocina' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class MenuComponent implements OnInit {
  categoriesWithProducts: CategoryWithProducts[] = [];
  cart: CartItem[] = [];
  notes = '';
  tableInput: number | null = null;
  tableNumber: number | null = null;
  showCart = false;
  loading = true;
  sending = false;
  sent = false;
  error = '';

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.categoryService.getAll().subscribe(categories => {
      this.productService.getAll().subscribe(products => {
        this.categoriesWithProducts = categories
          .filter(c => c.isActive)
          .map(c => ({
            ...c,
            products: products.filter(p => p.isAvailable && p.categoryId === c.id)
          }))
          .filter(c => c.products.length > 0);
        this.loading = false;
      });
    });
  }

  setTable() {
    if (this.tableInput && this.tableInput > 0) {
      this.tableNumber = this.tableInput;
    }
  }

  addToCart(product: Product) {
    const existing = this.cart.find(i => i.product.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({ product, quantity: 1 });
    }
  }

  updateQty(productId: string, delta: number) {
    const item = this.cart.find(i => i.product.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter(i => i.product.id !== productId);
    }
  }

  cartTotal(): number {
    return this.cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  sendOrder() {
    if (this.cart.length === 0 || !this.tableNumber) return;

    this.sending = true;
    this.error = '';
    this.sent = false;

    this.orderService.create({
      tableNumber: this.tableNumber,
      items: this.cart.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        notes: null
      })),
      notes: this.notes || null
    }).subscribe({
      next: () => {
        this.sent = true;
        this.cart = [];
        this.notes = '';
        this.sending = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al enviar pedido';
        this.sending = false;
      }
    });
  }
}
