import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-thankyou',
  templateUrl: './thankyou.component.html',
  styleUrl: './thankyou.component.scss',
})
export class ThankyouComponent {
  message: string;
  orderId: number;
  products: ProductResponseModel[] = [];
  cartTotal: number;

  constructor(private router: Router, private orderService: OrderService) {
    const navigation = this.router.getCurrentNavigation();

    const state = navigation!.extras.state as {
      message: string;
      products: ProductResponseModel[];
      orderId: number;
      total: number;
    };

    this.message = state.message;
    this.products = state.products;
    console.log(this.products);
    this.orderId = state.orderId;
    this.cartTotal = state.total;
  }
}

/** Модель товара в ответе на запрос (в компоненте) */
interface ProductResponseModel {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  quantityOrdered: number;
}
