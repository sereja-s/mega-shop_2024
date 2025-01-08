import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CartModelServer } from '../../models/cart.model';
import { OrderService } from '../../services/order.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  cartTotal: number = 0;
  cartData!: CartModelServer;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.cartService.cartData$.subscribe((data) => (this.cartData = data));
    this.cartService.cartTotal$.subscribe((total) => (this.cartTotal = total));
  }

  onCheckout() {
    if (this.cartTotal > 0) {
      this.spinner.show().then((p) => {
        this.cartService.CheckoutFromCart(2);
      });
    } else {
      return;
    }
  }
}
