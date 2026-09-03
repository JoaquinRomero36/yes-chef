import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { PaymentMethod } from '../../models/order.models';
import { Category } from '../../models/category.models';
import { Product } from '../../models/product.models';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { IconComponent } from '../../components/icon/icon.component';

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
  imports: [FormsModule, ThemeToggleComponent, IconComponent],
  template: `
    <div class="min-h-screen bg-background text-foreground flex flex-col">
      <header class="bg-primary text-primary-foreground sticky top-0 z-20 shadow-sm">
        <div class="h-16 px-4 flex items-center justify-between max-w-5xl mx-auto w-full">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-9 h-9 rounded-lg bg-accent text-accent-foreground shadow">
              <app-icon name="chef-hat" [size]="20" />
            </span>
            <div>
              <h1 class="text-lg font-bold leading-tight">YesChef</h1>
              @if (orderType && tableNumber) {
                <p class="text-xs text-primary-foreground/80 leading-tight">Mesa {{ tableNumber }}</p>
              }
            </div>
          </div>
          <div class="flex items-center gap-3">
            <app-theme-toggle />
            @if (cart.length > 0) {
              <button (click)="view = 'cart'" class="bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-sm font-medium relative flex items-center gap-1.5 anim-fade-up">
                <app-icon name="cart" [size]="16" /> \${{ cartTotal().toFixed(2) }}
                <span class="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center anim-pop">
                  {{ cart.length }}
                </span>
              </button>
            }
          </div>
        </div>
      </header>

      @if (step === 'menu' && view === 'menu' && !loading && categoriesWithProducts.length > 0) {
        <nav class="bg-card/95 backdrop-blur sticky top-16 z-10 border-b border-border shadow-sm anim-fade-down">
          <div class="max-w-5xl mx-auto px-4 w-full">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pt-2.5 pb-1">Menú</p>
            <div #navScroll class="flex gap-2 overflow-x-auto scrollbar-hide pb-2.5">
              @for (cat of categoriesWithProducts; track cat.id) {
                <a
                  #chip
                  href="#cat-{{ cat.id }}"
                  (click)="scrollToCategory($event, cat.id)"
                  class="whitespace-nowrap text-sm px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5"
                  [class]="activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground border-primary font-medium shadow-sm scale-[1.02]'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'"
                >
                  {{ cat.name }}
                </a>
              }
            </div>
          </div>
        </nav>
      }

      @if (step === 'type') {
        <div class="fixed inset-0 overflow-y-auto bg-background z-10 anim-fade-in">
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="w-full max-w-sm anim-fade-up">
              <h2 class="text-lg font-semibold text-muted-foreground mb-6 text-center">¿Cómo querés pedir?</h2>
              <div class="w-full space-y-3">
                <button (click)="selectType('dine-in')" class="w-full text-left bg-card rounded-xl p-4 border border-border hover:border-primary transition flex items-start gap-3 anim-fade-up" style="animation-delay: 60ms">
                  <span class="rounded-lg bg-primary/10 text-primary p-2 shrink-0"><app-icon name="dine-in" /></span>
                  <span>
                    <span class="font-medium block">Comer acá</span>
                    <span class="text-sm text-muted-foreground">Te atendemos en la mesa</span>
                  </span>
                </button>
                <button (click)="selectType('takeaway')" class="w-full text-left bg-card rounded-xl p-4 border border-border hover:border-primary transition flex items-start gap-3 anim-fade-up" style="animation-delay: 120ms">
                  <span class="rounded-lg bg-primary/10 text-primary p-2 shrink-0"><app-icon name="takeaway" /></span>
                  <span>
                    <span class="font-medium block">Para llevar</span>
                    <span class="text-sm text-muted-foreground">Retirás por el local</span>
                  </span>
                </button>
                <button (click)="selectType('delivery')" class="w-full text-left bg-card rounded-xl p-4 border border-border hover:border-primary transition flex items-start gap-3 anim-fade-up" style="animation-delay: 180ms">
                  <span class="rounded-lg bg-primary/10 text-primary p-2 shrink-0"><app-icon name="delivery" /></span>
                  <span>
                    <span class="font-medium block">Delivery</span>
                    <span class="text-sm text-muted-foreground">Te lo llevamos a casa</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (step === 'info') {
        <div class="fixed inset-0 overflow-y-auto bg-background z-10 anim-fade-in">
          <div class="flex min-h-full items-center justify-center p-4 pt-20">
            <div class="w-full max-w-md bg-card rounded-2xl border border-border p-4 sm:p-8 shadow-sm anim-fade-up">
            <div class="flex items-center justify-between mb-4">
              <button (click)="backToType()" class="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition">
                <app-icon name="chevron-left" [size]="16" /> Volver
              </button>
              <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary anim-zoom-in">
                @if (orderType === 'dine-in') {
                  <app-icon name="table" [size]="26" />
                }
                @if (orderType === 'takeaway') {
                  <app-icon name="takeaway" [size]="26" />
                }
                @if (orderType === 'delivery') {
                  <app-icon name="delivery" [size]="26" />
                }
              </div>
            </div>

            <div class="mb-5 text-center anim-fade-up" style="animation-delay: 60ms">
              <h2 class="text-lg font-semibold text-foreground">
                @if (orderType === 'dine-in') {¿Cuál es tu mesa?}
                @if (orderType === 'takeaway') {Tus datos}
                @if (orderType === 'delivery') {Dirección de entrega}
              </h2>
              <p class="text-sm text-muted-foreground mt-1">
                @if (orderType === 'dine-in') {Contanos en qué mesa estás sentado}
                @if (orderType === 'takeaway') {Así te llamamos cuando esté listo}
                @if (orderType === 'delivery') {Confirmá los datos de envío}
              </p>
            </div>

            <div class="space-y-3 anim-fade-up" style="animation-delay: 120ms">
              @if (orderType === 'dine-in') {
                <label class="block">
                  <span class="block text-sm font-medium text-foreground mb-1.5">Número de mesa</span>
                  <input type="number" [(ngModel)]="tableInput" placeholder="Ej: 5" min="1"
                    class="w-full text-center text-4xl font-bold py-4 px-4 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                    (keyup.enter)="startOrder()">
                </label>
              }

              @if (orderType === 'takeaway' || orderType === 'delivery') {
                <label class="block">
                  <span class="block text-sm font-medium text-foreground mb-1.5">Nombre</span>
                  <input type="text" [(ngModel)]="contactName" placeholder="Tu nombre" required
                    class="w-full px-4 py-2.5 border border-border rounded-xl bg-background placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition">
                </label>
                <label class="block">
                  <span class="block text-sm font-medium text-foreground mb-1.5">Teléfono</span>
                  <input type="tel" [(ngModel)]="contactPhone" placeholder="Ej: 3001234567" required
                    class="w-full px-4 py-2.5 border border-border rounded-xl bg-background placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition">
                </label>
              }

              @if (orderType === 'delivery') {
                <label class="block">
                  <span class="block text-sm font-medium text-foreground mb-1.5">Dirección</span>
                  <textarea [(ngModel)]="deliveryAddress" placeholder="Dirección completa" rows="2" required
                    class="w-full px-4 py-2.5 border border-border rounded-xl bg-background placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition resize-none"></textarea>
                </label>
              }

              <button (click)="startOrder()"
                class="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 active:scale-[0.99] transition mt-2 shadow-md shadow-primary/20">
                Ver menú
              </button>
            </div>
          </div>
        </div>
      </div>
      }

      @if (step === 'menu' && view === 'menu') {
        <main class="flex-1 max-w-5xl mx-auto p-4 w-full anim-fade-up">
          <div class="mb-4">
            <button (click)="backToInfo()" class="text-muted-foreground hover:text-foreground transition flex items-center gap-1">
              ← Volver
            </button>
          </div>
          @if (error) {
            <div class="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-4">{{ error }}</div>
          }
          @if (loading) {
            <p class="text-center text-muted-foreground py-8">Cargando menú...</p>
          } @else {
            @for (cat of categoriesWithProducts; track cat.id; let ci = $index) {
              <section id="cat-{{ cat.id }}" class="mb-8 scroll-mt-32 anim-fade-up" style="animation-delay: {{ ci * 60 }}ms">
                <h2 class="text-lg font-semibold text-primary mb-3 border-b border-border pb-1">{{ cat.name }}</h2>
                <div class="grid gap-3 md:grid-cols-2">
                @for (p of cat.products; track p.id; let pi = $index) {
                  <div class="flex justify-between items-start p-3 rounded-lg border border-border bg-card anim-fade-up transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md" [style.animation-delay]="((ci * 4) + pi) * 35 + 'ms'">
                    <div class="flex-1">
                      <h3 class="font-medium text-foreground">{{ p.name }}</h3>
                      @if (p.description) {
                        <p class="text-sm text-muted-foreground">{{ p.description }}</p>
                      }
                      <span class="text-primary font-semibold">\${{ p.price.toFixed(2) }}</span>
                    </div>
                    <button (click)="addToCart(p)"
                      class="ml-2 bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm hover:bg-primary/20 active:scale-95 transition">
                      + Agregar
                    </button>
                  </div>
                }
                </div>
              </section>
            }
          }
        </main>
      }

      @if (step === 'menu' && view === 'cart') {
        <div class="flex-1 max-w-xl mx-auto p-4 w-full anim-slide-in-right">
          <h2 class="text-lg font-semibold text-foreground mb-2">Tu pedido</h2>
          <p class="text-sm text-muted-foreground mb-4">
            @if (orderType === 'dine-in') {Mesa {{ tableNumber }}}
            @if (orderType === 'takeaway') {Para llevar — {{ contactName }}}
            @if (orderType === 'delivery') {Delivery — {{ deliveryAddress }}}
          </p>

          @if (sent) {
            <div class="bg-primary/10 text-primary px-4 py-3 rounded-lg mb-4">¡Pedido enviado!</div>
          }
          @if (error) {
            <div class="bg-destructive/10 text-destructive px-4 py-2 rounded-lg mb-4">{{ error }}</div>
          }

          @for (item of cart; track item.product.id) {
            <div class="flex items-center justify-between py-2 border-b border-border">
              <div class="flex-1">
                <p class="font-medium text-foreground">{{ item.product.name }}</p>
                <p class="text-sm text-muted-foreground">\${{ (item.product.price * item.quantity).toFixed(2) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button (click)="updateQty(item.product.id, -1)" class="w-9 h-9 rounded-full bg-muted hover:bg-muted/70">−</button>
                <span class="w-6 text-center font-medium">{{ item.quantity }}</span>
                <button (click)="updateQty(item.product.id, 1)" class="w-9 h-9 rounded-full bg-muted hover:bg-muted/70">+</button>
              </div>
            </div>
          }

          <div class="mt-4 space-y-2">
            <div class="flex justify-between font-semibold text-lg">
              <span>Subtotal</span>
              <span>\${{ subtotal().toFixed(2) }}</span>
            </div>
            @if (orderType === 'delivery') {
              <div class="flex justify-between text-sm text-muted-foreground">
                <span>Envío</span>
                <span>\$1,500.00</span>
              </div>
            }
            <div class="flex justify-between font-bold text-xl border-t border-border pt-2">
              <span>Total</span>
              <span>\${{ cartTotal().toFixed(2) }}</span>
            </div>
            @if (orderType === 'delivery') {
              <div class="pt-2">
                <p class="text-sm font-medium text-foreground mb-2">Método de pago</p>
                <div class="flex gap-2">
                  @for (m of paymentMethods; track m.value) {
                    <button type="button" (click)="paymentMethod = m.value"
                      [class]="paymentMethod === m.value
                        ? 'flex-1 border border-primary bg-primary/10 text-primary font-medium rounded-lg py-2 text-sm'
                        : 'flex-1 border border-border rounded-lg py-2 text-sm text-muted-foreground hover:border-primary/50'">
                      {{ m.label }}
                    </button>
                  }
                </div>
              </div>
            }
            <textarea [(ngModel)]="notes" placeholder="Notas para la cocina..." rows="2"
              class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card outline-none focus:ring-2 focus:ring-primary mt-2"></textarea>
            <div class="flex gap-2">
              <button (click)="view = 'menu'" class="flex-1 bg-muted text-muted-foreground py-2 rounded-lg hover:bg-muted/70 transition">
                Agregar más
              </button>
              <button (click)="sendOrder()" [disabled]="sending"
                class="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50">
                {{ sending ? 'Enviando...' : 'Enviar pedido' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class MenuComponent implements OnInit, OnDestroy {

  ngOnDestroy(): void {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  step: 'type' | 'info' | 'menu' = 'type';
  view: 'menu' | 'cart' = 'menu';
  orderType: 'dine-in' | 'takeaway' | 'delivery' = 'dine-in';
  paymentMethod: PaymentMethod | null = null;
  private allPaymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'debit', label: 'Débito' },
    { value: 'credit', label: 'Crédito' },
    { value: 'mercado_pago', label: 'Mercado Pago' },
    { value: 'voucher', label: 'Vale / Cuenta' }
  ];

  get paymentMethods(): { value: PaymentMethod; label: string }[] {
    return this.orderType === 'delivery'
      ? this.allPaymentMethods.filter(m => m.value !== 'cash')
      : this.allPaymentMethods;
  }

  tableInput: number | null = null;
  tableNumber: number | null = null;
  contactName = '';
  contactPhone = '';
  deliveryAddress = '';
  notes = '';

  categoriesWithProducts: CategoryWithProducts[] = [];
  cart: CartItem[] = [];
  loading = true;
  sending = false;
  sent = false;
  error = '';

  activeCategory: string | null = null;
  private scrollHandler: (() => void) | null = null;
  private programmaticScroll = false;
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  private allCategories: CategoryWithProducts[] = [];

  @ViewChild('navScroll', { static: false }) navScroll!: ElementRef<HTMLDivElement>;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.categoryService.getAll().subscribe({
      next: categories => {
        this.productService.getAll().subscribe({
          next: products => {
            this.allCategories = categories
              .filter(c => c.isActive)
              .map(c => ({
                ...c,
                products: products.filter(p => p.isAvailable && p.categoryId === c.id)
              }))
              .filter(c => c.products.length > 0);
            this.filterProducts();
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.error = 'Error al cargar productos';
          }
        });
      },
      error: () => {
        this.loading = false;
        this.error = 'Error al cargar el menú';
      }
    });
  }

  private filterProducts() {
    const away = this.orderType !== 'dine-in';
    this.categoriesWithProducts = this.allCategories
      .map(c => ({
        ...c,
        products: c.products.filter(p => !away || p.isAvailableForAway)
      }))
      .filter(c => c.products.length > 0);
    if (this.categoriesWithProducts.length > 0) {
      this.activeCategory = this.categoriesWithProducts[0].id;
      setTimeout(() => this.setupScrollListener(), 0);
    } else {
      this.activeCategory = null;
    }
  }

  private setupScrollListener(): void {
    const update = () => {
      if (this.programmaticScroll) return;
      const offset = 140;
      let current = this.categoriesWithProducts[0].id;
      for (const cat of this.categoriesWithProducts) {
        const el = document.getElementById(`cat-${cat.id}`);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = cat.id;
        }
      }
      if (current !== this.activeCategory) {
        this.activeCategory = current;
        this.scrollActiveChipIntoView();
      }
    };

    update();
    window.addEventListener('scroll', update, { passive: true });

    // guardar referencia para removerlo
    this.scrollHandler = update;
  }

  private scrollActiveChipIntoView(): void {
    if (!this.activeCategory) return;
    requestAnimationFrame(() => {
      const container = this.navScroll?.nativeElement;
      if (!container) return;
      const chip = Array.from(container.querySelectorAll<HTMLAnchorElement>('a'))
        .find(a => a.getAttribute('href') === `#cat-${this.activeCategory}`);
      if (!chip) return;
      chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  }

  scrollToCategory(event: Event, id: string): void {
    event.preventDefault();
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;

    this.programmaticScroll = true;
    this.activeCategory = id;
    this.scrollActiveChipIntoView();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.programmaticScroll = false;
      this.scrollHandler?.();
    }, 800);
  }

  backToType() {
    this.orderType = 'dine-in';
    this.tableInput = null;
    this.contactName = '';
    this.contactPhone = '';
    this.deliveryAddress = '';
    this.filterProducts();
    this.step = 'type';
  }

  selectType(type: 'dine-in' | 'takeaway' | 'delivery') {
    this.orderType = type;
    this.paymentMethod = null;
    this.filterProducts();
    this.step = 'info';
  }

  startOrder() {
    if (this.orderType === 'dine-in') {
      if (!this.tableInput || this.tableInput <= 0) return;
      this.tableNumber = this.tableInput;
    }
    if ((this.orderType === 'takeaway' || this.orderType === 'delivery') && !this.contactName) return;
    if (this.orderType === 'delivery' && !this.deliveryAddress) return;
    this.step = 'menu';
  }

  backToInfo() {
    this.view = 'menu';
    this.step = 'info';
  }

  addToCart(product: Product) {
    const existing = this.cart.find(i => i.product.id === product.id);
    if (existing) existing.quantity++;
    else this.cart.push({ product, quantity: 1 });
  }

  updateQty(productId: string, delta: number) {
    const item = this.cart.find(i => i.product.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) this.cart = this.cart.filter(i => i.product.id !== productId);
  }

  subtotal(): number {
    return this.cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  cartTotal(): number {
    const deliveryFee = this.orderType === 'delivery' ? 1500 : 0;
    return this.subtotal() + deliveryFee;
  }

  sendOrder() {
    if (this.cart.length === 0) return;
    if (this.orderType === 'delivery' && !this.paymentMethod) return;
    this.sending = true;
    this.error = '';
    this.sent = false;

    this.orderService.create({
      orderType: this.orderType,
      tableNumber: this.orderType === 'dine-in' ? this.tableNumber : null,
      contactName: this.orderType !== 'dine-in' ? this.contactName : null,
      contactPhone: this.orderType !== 'dine-in' ? this.contactPhone : null,
      deliveryAddress: this.orderType === 'delivery' ? this.deliveryAddress : null,
      paymentMethod: this.paymentMethod,
      notes: this.notes || null,
      items: this.cart.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        notes: null
      }))
    }).subscribe({
      next: () => {
        this.sent = true;
        this.cart = [];
        this.notes = '';
        this.paymentMethod = null;
        this.sending = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al enviar pedido';
        this.sending = false;
      }
    });
  }
}
