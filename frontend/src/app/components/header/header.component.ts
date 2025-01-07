import { Component, OnInit } from '@angular/core';
import { CartModelServer } from '../../models/cart.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  cartData!: CartModelServer;
  cartTotal!: number;

  constructor(protected cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cartTotal$.subscribe((total) => (this.cartTotal = total));
    this.cartService.cartData$.subscribe((data) => (this.cartData = data));
  }
}
