import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { Category } from '../../models/category.models';
import { Product } from '../../models/product.models';

interface CategoryWithProducts extends Category {
  products: Product[];
}

@Component({
  selector: 'app-menu',
  standalone: true,
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-emerald-600 text-white p-4 sticky top-0 z-10">
        <h1 class="text-xl font-bold text-center">YesChef</h1>
      </header>

      <main class="max-w-lg mx-auto p-4">
        @if (loading) {
          <p class="text-center text-gray-500">Cargando menú...</p>
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
                  </div>
                  <span class="text-emerald-700 font-semibold whitespace-nowrap ml-2">
                    \${{ p.price.toFixed(2) }}
                  </span>
                </div>
              }
            </section>
          }

          @if (categoriesWithProducts.length === 0) {
            <p class="text-center text-gray-400 mt-8">No hay productos disponibles</p>
          }
        }
      </main>
    </div>
  `
})
export class MenuComponent implements OnInit {
  categoriesWithProducts: CategoryWithProducts[] = [];
  loading = true;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService
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
}
