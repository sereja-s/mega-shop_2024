import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private products: ProductResposeModel[] = [];
  private SERVER_URL = environment.SERVER_URL;

  constructor(private http: HttpClient) {}

  getSingleOrder(orderId: number) {
    return this.http
      .get<ProductResposeModel[]>(this.SERVER_URL + 'orders/' + orderId)
      .toPromise();
  }
}

/**
 * Определим вне класса локальный интерфейс товара для заказа
 */
interface ProductResposeModel {
  id: number;
  title: string;
  description: string;
  price: number;
  quantityOrdered: number;
  image: string;
}
