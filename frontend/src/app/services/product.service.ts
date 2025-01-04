import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  //SERVER_URL = 'http://localhost:3000/api';
  private SERVER_URL = environment.SERVER_URL;

  // чтобы работать с HttpClient, нужно также импортировать HttpClientModule в app.module.ts
  constructor(private http: HttpClient) {}

  // Получим все товары из beckend-сервера
  getAllProducts(limitOfResults = 10) {
    return this.http.get<{ count: Number; products: any[] }>(
      this.SERVER_URL + 'products',
      {
        params: {
          limit: limitOfResults.toString(),
        },
      }
    );
  }
}
