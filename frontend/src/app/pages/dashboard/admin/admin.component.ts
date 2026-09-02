import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { AuthService } from '../../../services/auth.service';
import { Role } from '../../../models/auth.models';
import { Category } from '../../../models/category.models';
import { Product } from '../../../models/product.models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-foreground mb-6">Admin</h1>

      <div class="flex flex-wrap gap-4 mb-6">
        <button (click)="tab = 'categories'" [class]="tab === 'categories' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'"
          class="px-4 py-2 rounded-lg border border-border transition">Categorías</button>
        <button (click)="tab = 'products'" [class]="tab === 'products' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'"
          class="px-4 py-2 rounded-lg border border-border transition">Productos</button>
        <button (click)="tab = 'users'" [class]="tab === 'users' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'"
          class="px-4 py-2 rounded-lg border border-border transition">Usuarios</button>
      </div>

      @if (tab === 'categories') {
        <section class="anim-fade-up">
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <input [(ngModel)]="newCat.name" placeholder="Nombre" class="border border-border px-3 py-1.5 rounded-lg text-sm flex-1 min-w-[120px] bg-card outline-none focus:ring-2 focus:ring-primary">
            <input [(ngModel)]="newCat.description" placeholder="Descripción" class="border border-border px-3 py-1.5 rounded-lg text-sm flex-1 min-w-[160px] bg-card outline-none focus:ring-2 focus:ring-primary">
            <input [(ngModel)]="newCat.displayOrder" type="number" placeholder="Orden" class="border border-border px-3 py-1.5 rounded-lg text-sm w-20 bg-card outline-none focus:ring-2 focus:ring-primary">
            <button (click)="addCategory()" class="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm hover:bg-primary/90 transition">Agregar</button>
          </div>

          <div class="space-y-2">
            @for (cat of categories; track cat.id) {
              <div class="flex items-center justify-between bg-card px-4 py-2 rounded-lg border border-border">
                <div>
                  <span class="font-medium">{{ cat.name }}</span>
                  @if (cat.description) {
                    <span class="text-muted-foreground text-sm ml-2">{{ cat.description }}</span>
                  }
                </div>
                <button (click)="deleteCategory(cat)" class="text-destructive hover:text-destructive/80 text-sm">Eliminar</button>
              </div>
            }
          </div>
        </section>
      }

      @if (tab === 'products') {
        <section class="anim-fade-up">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            @for (p of products; track p.id) {
              <div class="bg-card rounded-lg border border-border p-3">
                <h3 class="font-medium text-sm">{{ p.name }}</h3>
                <p class="text-xs text-muted-foreground">{{ p.categoryName }}</p>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-primary font-semibold">\${{ p.price.toFixed(2) }}</span>
                  <div class="flex items-center gap-2">
                    @if (!p.isAvailableForAway) {
                      <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">Solo local</span>
                    }
                    <button (click)="deleteProduct(p)" class="text-destructive hover:text-destructive/80 text-xs">✕</button>
                  </div>
                </div>
              </div>
            }
          </div>

          <details class="mt-6">
            <summary class="cursor-pointer text-primary font-medium">+ Nuevo producto</summary>
            <div class="mt-3 bg-card border border-border rounded-lg p-4 space-y-3 max-w-md">
              <input [(ngModel)]="newProd.name" placeholder="Nombre" class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary">
              <input [(ngModel)]="newProd.description" placeholder="Descripción" class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary">
              <input [(ngModel)]="newProd.price" type="number" step="0.01" placeholder="Precio" class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary">
              <select [(ngModel)]="newProd.categoryId" class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary">
                <option value="">Seleccioná categoría</option>
                @for (cat of categories; track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
              <label class="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" [(ngModel)]="newProd.isAvailableForAway" class="rounded border-border">
                Disponible para delivery/takeaway
              </label>
              <button (click)="addProduct()" class="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm hover:bg-primary/90 transition">Guardar</button>
            </div>
          </details>
        </section>
      }

      @if (tab === 'users') {
        <section class="max-w-md anim-fade-up">
          <div class="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 class="font-medium text-foreground">Agregar empleado</h3>
            <input [(ngModel)]="newUser.fullName" placeholder="Nombre completo" class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary">
            <input [(ngModel)]="newUser.username" placeholder="Usuario" class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary">
            <input [(ngModel)]="newUser.email" type="email" placeholder="Email" class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary">
            <input [(ngModel)]="newUser.password" type="password" placeholder="Contraseña" class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary">
            <select [(ngModel)]="newUser.roleId" class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary">
              <option value="">Seleccioná un rol</option>
              @for (r of staffRoles; track r.id) {
                <option [value]="r.id">{{ roleLabel(r.name) }} ({{ r.name }})</option>
              }
            </select>
            @if (userError) {
              <p class="text-destructive text-sm">{{ userError }}</p>
            }
            @if (userSuccess) {
              <p class="text-primary text-sm">{{ userSuccess }}</p>
            }
            <button (click)="addUser()" class="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm hover:bg-primary/90 transition">Crear usuario</button>
          </div>
        </section>
      }
    </div>
  `
})
export class AdminComponent implements OnInit {
  tab: 'categories' | 'products' | 'users' = 'categories';
  categories: Category[] = [];
  products: Product[] = [];
  staffRoles: Role[] = [];

  newCat = { name: '', description: '', displayOrder: 0 };
  newProd = { name: '', description: '', price: 0, categoryId: '', isAvailableForAway: true };
  newUser = { fullName: '', username: '', email: '', password: '', roleId: '' };
  userError = '';
  userSuccess = '';

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
    this.loadRoles();
  }

  loadRoles() {
    this.authService.getRoles().subscribe(roles => {
      const staff = ['admin', 'waiter', 'kitchen'];
      this.staffRoles = roles.filter(r => staff.includes(r.name.toLowerCase()));
    });
  }

  roleLabel(name: string): string {
    const map: Record<string, string> = {
      admin: 'Administrador',
      waiter: 'Mozo',
      kitchen: 'Cocina'
    };
    return map[name] || name;
  }

  addUser() {
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password || !this.newUser.roleId) {
      this.userError = 'Completá usuario, email, contraseña y rol';
      return;
    }
    this.userError = '';
    this.userSuccess = '';
    this.authService.createStaff({
      username: this.newUser.username,
      email: this.newUser.email,
      password: this.newUser.password,
      fullName: this.newUser.fullName || null,
      roleId: this.newUser.roleId
    }).subscribe({
      next: () => {
        this.newUser = { fullName: '', username: '', email: '', password: '', roleId: '' };
        this.userSuccess = 'Usuario creado correctamente';
      },
      error: (err) => {
        this.userError = err.error?.message || 'Error al crear el usuario';
      }
    });
  }

  loadCategories() {
    this.categoryService.getAll().subscribe(c => this.categories = c);
  }

  loadProducts() {
    this.productService.getAll().subscribe(p => this.products = p);
  }

  addCategory() {
    if (!this.newCat.name) return;
    this.categoryService.create({
      name: this.newCat.name,
      description: this.newCat.description || null,
      displayOrder: this.newCat.displayOrder
    }).subscribe(() => {
      this.newCat = { name: '', description: '', displayOrder: 0 };
      this.loadCategories();
    });
  }

  deleteCategory(cat: Category) {
    this.categoryService.delete(cat.id).subscribe(() => this.loadCategories());
  }

  addProduct() {
    if (!this.newProd.name || !this.newProd.categoryId) return;
    this.productService.create({
      name: this.newProd.name,
      description: this.newProd.description || null,
      price: this.newProd.price,
      categoryId: this.newProd.categoryId,
      imageUrl: null,
      isAvailableForAway: this.newProd.isAvailableForAway
    }).subscribe(() => {
      this.newProd = { name: '', description: '', price: 0, categoryId: '', isAvailableForAway: true };
      this.loadProducts();
    });
  }

  deleteProduct(p: Product) {
    this.productService.delete(p.id).subscribe(() => this.loadProducts());
  }
}
