import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { Category } from '../../../models/category.models';
import { Product } from '../../../models/product.models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">⚙️ Admin</h1>

      <div class="flex gap-4 mb-6">
        <button (click)="tab = 'categories'" [class]="tab === 'categories' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700'"
          class="px-4 py-2 rounded-lg border transition">Categorías</button>
        <button (click)="tab = 'products'" [class]="tab === 'products' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700'"
          class="px-4 py-2 rounded-lg border transition">Productos</button>
      </div>

      @if (tab === 'categories') {
        <section>
          <div class="flex items-center gap-2 mb-4">
            <input [(ngModel)]="newCat.name" placeholder="Nombre" class="border px-3 py-1.5 rounded-lg text-sm flex-1 outline-none focus:ring-2 focus:ring-emerald-500">
            <input [(ngModel)]="newCat.description" placeholder="Descripción" class="border px-3 py-1.5 rounded-lg text-sm flex-1 outline-none focus:ring-2 focus:ring-emerald-500">
            <input [(ngModel)]="newCat.displayOrder" type="number" placeholder="Orden" class="border px-3 py-1.5 rounded-lg text-sm w-20 outline-none focus:ring-2 focus:ring-emerald-500">
            <button (click)="addCategory()" class="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-emerald-700 transition">Agregar</button>
          </div>

          <div class="space-y-2">
            @for (cat of categories; track cat.id) {
              <div class="flex items-center justify-between bg-white px-4 py-2 rounded-lg border">
                <div>
                  <span class="font-medium">{{ cat.name }}</span>
                  @if (cat.description) {
                    <span class="text-gray-500 text-sm ml-2">{{ cat.description }}</span>
                  }
                </div>
                <button (click)="deleteCategory(cat)" class="text-red-500 hover:text-red-700 text-sm">Eliminar</button>
              </div>
            }
          </div>
        </section>
      }

      @if (tab === 'products') {
        <section>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            @for (p of products; track p.id) {
              <div class="bg-white rounded-lg border p-3">
                <h3 class="font-medium text-sm">{{ p.name }}</h3>
                <p class="text-xs text-gray-500">{{ p.categoryName }}</p>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-emerald-700 font-semibold">\${{ p.price.toFixed(2) }}</span>
                  <button (click)="deleteProduct(p)" class="text-red-500 hover:text-red-700 text-xs">✕</button>
                </div>
              </div>
            }
          </div>

          <details class="mt-6">
            <summary class="cursor-pointer text-emerald-700 font-medium">+ Nuevo producto</summary>
            <div class="mt-3 bg-white border rounded-lg p-4 space-y-3 max-w-md">
              <input [(ngModel)]="newProd.name" placeholder="Nombre" class="w-full border px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <input [(ngModel)]="newProd.description" placeholder="Descripción" class="w-full border px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <input [(ngModel)]="newProd.price" type="number" step="0.01" placeholder="Precio" class="w-full border px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <select [(ngModel)]="newProd.categoryId" class="w-full border px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Seleccioná categoría</option>
                @for (cat of categories; track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
              <button (click)="addProduct()" class="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-emerald-700 transition">Guardar</button>
            </div>
          </details>
        </section>
      }
    </div>
  `
})
export class AdminComponent implements OnInit {
  tab: 'categories' | 'products' = 'categories';
  categories: Category[] = [];
  products: Product[] = [];

  newCat = { name: '', description: '', displayOrder: 0 };
  newProd = { name: '', description: '', price: 0, categoryId: '' };

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
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
      imageUrl: null
    }).subscribe(() => {
      this.newProd = { name: '', description: '', price: 0, categoryId: '' };
      this.loadProducts();
    });
  }

  deleteProduct(p: Product) {
    this.productService.delete(p.id).subscribe(() => this.loadProducts());
  }
}
