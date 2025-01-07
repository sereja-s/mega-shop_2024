import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Router } from '@angular/router';
import { ProductModelServer, ServerResponse } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  products: ProductModelServer[] = [];

  //products: any[] = [];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe((prods: ServerResponse) => {
      this.products = prods.products;
    });
    /* this.productService
      .getAllProducts()
      .subscribe((prods: { count: number; products: any[] }) => {
        this.products = prods.products;
        //console.log(this.products);
      }); */
  }

  selectProduct(id: number) {
    this.router.navigate(['/product', id]).then();
  }

  AddToCart(id: number) {
    this.cartService.AddProductToCart(id);
  }
}
