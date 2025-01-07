import { Component, OnInit } from '@angular/core';
import { CartModelServer } from '../../models/cart.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  cartData!: CartModelServer;
  cartTotal: number = 0;
  subTotal: number = 0;

  constructor(protected cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cartData$.subscribe(
      (data: CartModelServer) => (this.cartData = data)
    );
    this.cartService.cartTotal$.subscribe((total) => (this.cartTotal = total));
  }

  ChangeQuantity(index: number, increase: boolean) {
    this.cartService.UpdateCartItems(index, increase);
  }
}
