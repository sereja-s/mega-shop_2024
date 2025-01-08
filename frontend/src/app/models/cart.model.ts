import { ProductModelServer } from './product.model';

/**
 * Модель со скрытими от клиента данными о корзине (для работы с сервером)
 */
export interface CartModelServer {
  total: number;
  /** скрытая полная информация о товаре и его количестве (для работы с сервером) */
  data: [
    {
      product?: ProductModelServer;
      numInCart: number;
    }
  ];
}

/**
 * Модель корзины с общедоступными данными для работы с клиентом
 */
export interface CartModelPublic {
  total: number;
  /** информация доступная для клиента о идентификаторе и количестве товаров в корзине */
  prodData: [
    {
      id: number;
      incart: number;
    }
  ];
}
