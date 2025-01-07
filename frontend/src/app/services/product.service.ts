import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { ProductModelServer, ServerResponse } from '../models/product.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  //SERVER_URL = 'http://localhost:3000/api';
  private SERVER_URL = environment.SERVER_URL;

  // чтобы работать с HttpClient, нужно также импортировать HttpClientModule в app.module.ts
  constructor(private http: HttpClient) {}

  /** Получим все товары от backend-сервера */
  getAllProducts(limitOfResults = 10): Observable<ServerResponse> {
    return this.http.get<ServerResponse>(this.SERVER_URL + 'products', {
      params: {
        limit: limitOfResults.toString(),
      },
    });
  }
  /* getAllProducts(limitOfResults = 10) {
    return this.http.get<{ count: number; products: any[] }>(
      this.SERVER_URL + 'products',
      {
        params: {
          limit: limitOfResults.toString(),
        },
      }
    );
  } */

  /** Получим один товар от backend-сервера */
  getSingleProduct(id: number): Observable<ProductModelServer> {
    return this.http.get<ProductModelServer>(
      this.SERVER_URL + 'products/' + id
    );
  }

  /** Получим товары указанной категории от backend-сервера */
  getProductsFromCategory(catName: string): Observable<ProductModelServer[]> {
    return this.http.get<ProductModelServer[]>(
      this.SERVER_URL + 'products/category/' + catName
    );
  }
}
