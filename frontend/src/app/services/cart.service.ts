import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ProductService } from './product.service';
import { OrderService } from './order.service';
import { environment } from '../../environments/environment.development';
import { CartModelPublic, CartModelServer } from '../models/cart.model';
import { BehaviorSubject } from 'rxjs';
import { NavigationExtras, Router } from '@angular/router';
import { ProductModelServer } from '../models/product.model';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private SERVER_URL = environment.SERVER_URL;

  /** переменная данных для хранения информации о корзине в локальном хранилише браузера клиента */
  private cartDataClient: CartModelPublic = {
    total: 0,
    prodData: [
      {
        id: 0,
        incart: 0,
      },
    ],
  };

  /** переменная данных для хранения информации о корзине на сервере (интерфейсный сервер этого приложения в папке frontend, а не backend-сервер) */
  private cartDataServer: CartModelServer = {
    total: 0,
    data: [
      {
        product: undefined,
        numInCart: 0,
      },
    ],
  };

  // Создадим наблюдаемые компоненты для подписки:
  /** Наблюдаемая итоговая сумма заказа в корзине */
  cartTotal$ = new BehaviorSubject<number>(0); // субъект поведения возвращает наблюдаемое с типом: number и начальным значением: 0
  /** Наблюдаемые данные о товарах заказа в корзине */
  cartData$ = new BehaviorSubject<CartModelServer>(this.cartDataServer);

  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private orderService: OrderService,
    private router: Router,
    private toast: ToastrService,
    private spinner: NgxSpinnerService
  ) {
    this.cartTotal$.next(this.cartDataServer.total);
    this.cartData$.next(this.cartDataServer);

    /** Переменная с информацией из локального хранилища(если она там имеется) */
    let info: CartModelPublic = JSON.parse(localStorage.getItem('cart')!);

    if (info !== null && info !== undefined && info.prodData[0].incart !== 0) {
      // т.к. локальное хранилище не пустое и содержит какую то информацию, то сохраним эту актуальную информацию о корзине для клиента
      this.cartDataClient = info;
      // пройдёмся по каждой записи и поместим в объект данных корзины
      this.cartDataClient.prodData.forEach((p) => {
        this.productService
          .getSingleProduct(p.id)
          .subscribe((actualProdInfo: ProductModelServer) => {
            if (this.cartDataServer.data[0].numInCart === 0) {
              // установим начальные значения количества каждого товара в корзине (из локального хранилища)
              this.cartDataServer.data[0].numInCart = p.incart;
              // а также информацию о каждом продукте в корзине
              this.cartDataServer.data[0].product = actualProdInfo;

              // ОБНОВИТЬ ОБЩУЮ СУММУ
              this.CalculateTotal();

              // обновим общую сумму клиента корзины из данных на сервере:
              this.cartDataClient.total = this.cartDataServer.total;
              // установим обновлённые данные о корзине клиента в локальное хранилище
              localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
            } else {
              // т.е. на сервере уже есть запись о данных корзины
              this.cartDataServer.data.push({
                numInCart: p.incart,
                product: actualProdInfo,
              });

              // ОБНОВИТЬ ОБЩУЮ СУММУ
              this.CalculateTotal();

              // обновим данные для клиента(общую сумму заказа) на актуальные данные с сервера
              this.cartDataClient.total = this.cartDataServer.total;
              localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
            }

            // создадим объект данных корзины (его копию) и отправим всем кто подписан:
            this.cartData$.next({ ...this.cartDataServer });
          });
      });
    }
  }

  AddProductToCart(id: number, quantity?: number) {
    this.productService.getSingleProduct(id).subscribe((prod) => {
      // 1) Если корзина пуста
      if (this.cartDataServer.data[0].product === undefined) {
        this.cartDataServer.data[0].product = prod;
        this.cartDataServer.data[0].numInCart =
          quantity !== undefined ? quantity : 1;

        // ОБНОВИТЬ ОБЩУЮ СУММУ
        this.CalculateTotal();

        // обновим данные о корзине клиента
        this.cartDataClient.prodData[0].incart =
          this.cartDataServer.data[0].numInCart;
        this.cartDataClient.prodData[0].id = prod.id;
        this.cartDataClient.total = this.cartDataServer.total;

        // обновим локальное хранилище
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));

        // Создаём и отправляем копию объекта: cartDataServer с данными корзины клиента)
        this.cartData$.next({ ...this.cartDataServer });

        // ОТОБРАЗИМ ВСПЛЫВАЮЩЕЕ УВЕДОМЛЕНИЕ
        this.toast.success(`${prod.name} добавлен в корзину`, 'Товар', {
          timeOut: 3000,
          progressBar: true,
          progressAnimation: 'increasing',
          positionClass: 'toast-top-right',
        });
      } else {
        // 2) Если в корзине есть товары
        // найдём индекс товара в корзине:
        const index = this.cartDataServer.data.findIndex(
          (p) => p.product!.id === prod.id
        ); // в результате вернёт: index = -1(т.е. false) или положительное значение

        // условие: если товар который вы добавляете уже есть в корзине, т.е. index равен положительному значению
        if (index !== -1) {
          if (quantity !== undefined && quantity <= prod.quantity) {
            // если количество товара, добавленного в корзину меньше чем этого товара имеется на складе(в БД), то сохраним его в корзине, иначе оганичиваем количеством товара в БД(на складе)
            this.cartDataServer.data[index].numInCart =
              this.cartDataServer.data[index].numInCart < prod.quantity
                ? quantity
                : prod.quantity;
          } else {
            // если добавляемого в корзину товара ещё нет в корзине, то увеличим его количество на 1 (если такой товар ещё пе закончился в БД)
            this.cartDataServer.data[index].numInCart < prod.quantity
              ? this.cartDataServer.data[index].numInCart++
              : prod.quantity;
          }
          // обновим информацию для клиента
          this.cartDataClient.prodData[index].incart =
            this.cartDataServer.data[index].numInCart;

          // ОБНОВИТЬ ОБЩУЮ СУММУ
          this.CalculateTotal();
          this.cartDataClient.total = this.cartDataServer.total;
          localStorage.setItem('cart', JSON.stringify(this.cartDataClient));

          // ОТОБРАЗИМ ВСПЛЫВАЮЩЕЕ УВЕДОМЛЕНИЕ
          this.toast.info(
            `${prod.name} в корзине изменено`,
            'Количество товара',
            {
              timeOut: 3000,
              progressBar: true,
              progressAnimation: 'increasing',
              positionClass: 'toast-top-right',
            }
          );
        } else {
          // условие: добавляемого товара нет в корзине, добавим его как новый объект данных на сервере
          this.cartDataServer.data.push({
            numInCart: 1,
            product: prod,
          });
          // а также добавим его для клиента
          this.cartDataClient.prodData.push({
            incart: 1,
            id: prod.id,
          });

          //localStorage.setItem('cart', JSON.stringify(this.cartDataClient));

          // ОТОБРАЗИМ ВСПЛЫВАЮЩЕЕ УВЕДОМЛЕНИЕ
          this.toast.success(`${prod.name} добавлен в корзину`, 'Товар', {
            timeOut: 3000,
            progressBar: true,
            progressAnimation: 'increasing',
            positionClass: 'toast-top-right',
          });

          // ОБНОВИТЬ ОБЩУЮ СУММУ
          this.CalculateTotal();

          this.cartDataClient.total = this.cartDataServer.total;
          localStorage.setItem('cart', JSON.stringify(this.cartDataClient));

          // все компоненты подписанные на наблюдаемый объект получат новые значения для новых элементов корзины
          this.cartData$.next({ ...this.cartDataServer });
        }
      }
    });
  }

  UpdateCartItems(index: number, increase: boolean) {
    let data = this.cartDataServer.data[index];
    if (increase) {
      data.numInCart < data.product!.quantity
        ? data.numInCart++
        : data.product!.quantity;
      this.cartDataClient.prodData[index].incart = data.numInCart;

      // ОБНОВИТЬ ОБЩУЮ СУММУ
      this.CalculateTotal();

      this.cartDataClient.total = this.cartDataServer.total;
      localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      this.cartData$.next({ ...this.cartDataServer });
    } else {
      if (data.numInCart > 1) {
        data.numInCart--;

        this.cartData$.next({ ...this.cartDataServer });
        this.cartDataClient.prodData[index].incart = data.numInCart;

        // ОБНОВИТЬ ОБЩУЮ СУММУ
        this.CalculateTotal();
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      }
    }
  }

  DeleteProductFromCart(index: number) {
    if (!window.confirm('Вы уверены, что хотите удалить товар ?')) {
      // ОТОБРАЗИМ ВСПЛЫВАЮЩЕЕ УВЕДОМЛЕНИЕ
      this.toast.success(`не удалён`, 'Товар', {
        timeOut: 3000,
        progressBar: true,
        progressAnimation: 'increasing',
        positionClass: 'toast-top-right',
      });
      return;
    } else {
      this.cartDataServer.data.splice(index, 1);
      this.cartDataClient.prodData.splice(index, 1);

      // ОБНОВИТЬ ОБЩУЮ СУММУ
      this.CalculateTotal();
      this.cartDataClient.total = this.cartDataServer.total;

      // Обнулим данные о корзине для клиента, если общая сумма будет равна нулю
      if (this.cartDataClient.total === 0) {
        this.cartDataClient = {
          total: 0,
          prodData: [
            {
              incart: 0,
              id: 0,
            },
          ],
        };
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      } else {
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      }

      // Обнулим данные о корзине для сервера, если общая сумма будет равна нулю
      if (this.cartDataServer.total === 0) {
        this.cartDataServer = {
          total: 0,
          data: [
            {
              numInCart: 0,
              product: undefined,
            },
          ],
        };
        this.cartData$.next({ ...this.cartDataServer });
      } else {
        this.cartData$.next({ ...this.cartDataServer });
      }
    }
  }

  private CalculateTotal() {
    let Total = 0;
    this.cartDataServer.data.forEach((p) => {
      // получим количество товаров и цену в корзине
      const { numInCart } = p;
      const { price } = p.product!;

      Total += numInCart * price;
    });

    this.cartDataServer.total = Total;
    // выведем общую наблюдаемую сумму
    this.cartTotal$.next(this.cartDataServer.total);
  }

  CheckoutFromCart(userId: number) {
    this.http
      .post<{ success: boolean }>(`${this.SERVER_URL}orders/payment`, null)
      .subscribe((res: { success: boolean }) => {
        if (res.success) {
          this.resetServerData();
          this.http
            .post<OrderResponse>(`${this.SERVER_URL}orders/new`, {
              userId: userId,
              products: this.cartDataClient.prodData,
            })
            .subscribe((data: OrderResponse) => {
              this.orderService.getSingleOrder(data.order_id).then((prods) => {
                if (data.success) {
                  // ведём дополнительные функции навигации
                  const navigationExtras: NavigationExtras = {
                    // поместим св-ва в объект состояния
                    state: {
                      message: data.message,
                      products: prods,
                      orderId: data.order_id,
                      total: this.cartDataClient.total,
                    },
                  };
                  // УСТАНОВИМ УКАЗАТЕЛЬ ЗАГРУЗКИ
                  this.spinner.hide().then();

                  // вызовем маршрут к странице благодарности
                  this.router
                    .navigate(['/thankyou'], navigationExtras)
                    .then((p) => {
                      this.cartDataClient = {
                        total: 0,
                        prodData: [
                          {
                            incart: 0,
                            id: 0,
                          },
                        ],
                      };

                      this.cartTotal$.next(0);
                      localStorage.setItem(
                        'cart',
                        JSON.stringify(this.cartDataClient)
                      );
                    });
                }
              });
            });
        } else {
          this.spinner.hide().then();
          this.router.navigateByUrl('/checkout').then();
          this.toast.error('не удалось оформить!', 'Заказ', {
            timeOut: 3000,
            progressBar: true,
            progressAnimation: 'increasing',
            positionClass: 'toast-top-right',
          });
        }
      });
  }

  /**
   * Метод сбросит данные корзины интерфейсного сервера приложения
   */
  private resetServerData() {
    this.cartDataServer = {
      total: 0,
      data: [
        {
          numInCart: 0,
          product: undefined,
        },
      ],
    };

    // отправим новый объект, тем кто подписан
    this.cartData$.next({ ...this.cartDataServer });
  }

  /**
   * Промежуточный итог в корзине
   */
  CalculateSubTotal(index: number): number {
    let subTotal = 0;

    const p = this.cartDataServer.data[index];

    subTotal = p.product!.price * p.numInCart;

    return subTotal;
  }
}

/**
 * Создадим интерфейс ответа на заказ за пределами класса
 */
interface OrderResponse {
  order_id: number;
  success: boolean;
  message: string;
  products: [
    {
      id: string;
      numInCart: string;
    }
  ];
}
