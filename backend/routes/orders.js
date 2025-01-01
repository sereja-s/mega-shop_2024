const express = require('express');
const router = express.Router();
const { database } = require('../config/helpers');

// Маршрут для получения всех заказов:
router.get('/', (req, res) => {
	database.table('orders_details as od')
		.join([
			{
				table: 'orders as o',
				on: 'o.id = od.order_id'
			},
			{
				table: 'products as p',
				on: 'p.id = od.product_id'
			},
			{
				table: 'users as u',
				on: 'u.id = o.user_id'
			},
		])
		.withFields(['o.id', 'p.title as name', 'p.description', 'p.price', 'u.username'])
		.sort({id: -1})
		.getAll()
		.then(orders => {
			if (orders.length > 0) {
				res.status(200).json(orders);
			} else {
				res.json({ message: 'Заказов не найдено !' })
			}
		}).catch(err => console.log(err));
});

// Маршрут для получения всех товаров одного заказа по указанному в запросе идентификатору заказа:
router.get('/:id', (req, res) => {
	// извлечём идентификатор заказа из запроса
	let orderId = req.params.id;
	database.table('orders_details as od')
		.join([
			{
				table: 'orders as o',
				on: 'o.id = od.order_id'
			},
			{
				table: 'products as p',
				on: 'p.id = od.product_id'
			},
			{
				table: 'users as u',
				on: 'u.id = o.user_id'
			}
		])
		.withFields(['o.id', 'p.title as name', 'p.description', 'p.price', 'u.username', 'p.image', 'od.quantity as quantityOrdered'])
		.filter({ 'o.id': orderId })
		.getAll()
		.then(orders => {
			if (orders.length > 0) {
				res.status(200).json(orders);
			} else {
				res.json({ message: `Нет заказа с orderId(идентификатором заказа) = ${orderId} !` })
			}
		}).catch(err => console.log(err));
});

router.post('/new',  (req, res) => {
	// для проверки работы запроса в Postman, установим переключатель на body, положение: raw и напишем тело запроса например: 
	/* {
    "userId":"11",
	 "products": [{ "id": "1", "incart": "2" }, { "id": "18", "incart": "3" }, { "id": "32", "incart": "3" }, { "id": "13", "incart": "8" }]
	} */
	// получим данные из тела запроса
	let { userId, products } = req.body;
	
	//console.log(req.body);

	if(userId !== null && userId > 0) {
		 database.table('orders')
			  .insert({
					user_id: userId
			  })
			  .then(newOrderId => {
					if(newOrderId.insertId > 0) {
						 products.forEach(async (p) => {
							  let data = await database.table('products')
									.filter({id: p.id})
									.withFields(['quantity'])
									.get();

								// сохраним в переменной количество заказанного товара
							  let inCart = p.incart;
							
							 if (data.quantity > 0) {
								  // если товаров больше 0, получим остаточное количество товара в БД после удаления из БД заказанного количества этого товара
									data.quantity = data.quantity - inCart;

								 // при достижении количества товаров равного 0
									if(data.quantity < 0) {
										 data.quantity = 0;
									}
							  } else {
									data.quantity = 0;
							  }

							  // Добавим информацию о заказе с соответствующим идентификатором
							  database.table('orders_details')
									.insert({
										 order_id: newOrderId.insertId,
										 product_id: p.id,
										 quantity: inCart
									}).then(newId => {
									database.table('products')
										 .filter({id: p.id})
										 .update({
											  quantity: data.quantity
										 }).then(successNum => {}).catch(err => console.log(err));
							  }).catch(err => console.log(err));
						 });
					} else {
						 res.json({message: `При добавлении сведений о новом заказе произошла ошибка !!!`, success: false});
				  }
				  // при успешном добавлении заказа отправим ответ:
				  res.json({
					  message: `Заказ успешно размещен с использованием идентификатора заказа ${newOrderId.insertId}`,
					  success: true,
					  order_id: newOrderId.insertId,
					  products: products
				  });
					//sendmail.OrderEmail(userId, products, newOrderId.insertId)
			  }).catch(err => console.log(err));
	} else {
		 res.json({message: `Новый заказ не создан !!!`, success: false});
	}

});

// Платежный шлюз:
router.post('/payment', (req, res) => {
	// выполнение этого запроса откладываем на 3-и секунды (3000 миллисекунд)
	setTimeout(() => {
		res.status(200).json({ success: true });
	}, 3000)
});


module.exports = router;