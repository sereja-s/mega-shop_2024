const express = require('express');
const router = express.Router();

// Получим объект БД
const {database} = require('../config/helpers');

// 1) Получим маршрут ко всем товарам постранично:
// Sending Page Query Parameter is mandatory http://localhost:3000/api/products?page=1

router.get('/', function (req, res) { 
	// определим текущий номер страницы
	let page = (req.query.page !== undefined && req.query.page !== 0) ? req.query.page : 1;
	// установим ограничение элементов на странице
	const limit = (req.query.limit !== undefined && req.query.limit !== 0) ? req.query.limit : 10;

	// опеделим переменные начального и конечного индекса товаров на странице
	let startValue;
	let endValue;

	if (page > 0) {
		startValue = (page * limit) - limit;     // 0, 10, 20, 30
		endValue = page * limit;                  // 10, 20, 30, 40
  } else {
		startValue = 0;
		endValue = 10;
	}
	
	// обратимся к таблице: товаров в БД
	database.table('products as p')
		// в запросе объединим таблицы товаров и категорий БД (используем массив объектов)
		 .join([
			  {
					table: "categories as c",
					on: `c.id = p.cat_id`
			  }
		 ])
		// укажем какие поля из обоих таблиц нам нужны
		 .withFields(['c.title as category',
			  'p.title as name',
			  'p.price',
			  'p.quantity',
			  'p.description',
			  'p.image',
			  'p.id'
		 ])
		// ограничим диапазон выборки
		.slice(startValue, endValue)
		// отсортируеи по идентификатору (по возрастанию)
		.sort({ id: .1 })
		// получим все товары отвечающие условию запроса
		 .getAll()
		 .then(prods => {
			  if (prods.length > 0) {
					res.status(200).json({
						 count: prods.length,
						 products: prods
					});
			  } else {
					res.json({message: "Товары не найдены !"});
			  }
		 })
		.catch(err => console.log(err));
	
});

// 2) Получим маршрут к товару с указанным в запросе id:
router.get('/:prodId', (req, res) => {
	// получим идентификатор товара(продукта) из параметра запроса:
	let productId = req.params.prodId;

	database.table('products as p')
		.join([
			{
				table: 'categories as c',
				on: 'p.cat_id = c.id'
			}
		])
		.withFields(['c.title as category',
			'p.title as name',
			'p.price',
			'p.quantity',
			'p.description',
			'p.image',
			'p.images',
			'p.id'
		])
		.filter({ 'p.id': productId })
		.get()
		.then(prod => {
			if (prod) {
				res.status(200).json(prod);
			} else {
				res.json({ message: `Нет товара с id ${productId} !` });
			}
		}).catch(err => console.log(err));
});

// 3) Получим маршрут к товарам одной конкретной категории:
router.get('/category/:catName', (req, res) => {
	let page = (req.query.page != undefined && req.query.page != 0) ? req.query.page : 1;
	const limit = (req.query.limit != undefined && req.query.limit != 0) ? req.query.limit : 10;
	let startValue;
	let endValue;
	if (page > 0) {
		startValue = (page * limit) - limit;
		endValue = page * limit;
	} else {
		startValue = 0;
		endValue = 10;
	}
		// получим название категории из параметра в url-адресе
		const cat_title = req.params.catName;

		database.table('products as p')
			.join([
				{
					table: 'categories as c',
					on: `p.cat_id = c.id WHERE c.title LIKE '%${cat_title}%'`
				}
			])
			.withFields(['c.title as category',
				'p.title as name',
				'p.price',
				'p.quantity',
				'p.description',
				'p.image',
				'p.id'
			])
			.slice(startValue, endValue)
			.sort({ id: 1 })
			.getAll()
			.then(prods => {
				if (prods.length > 0) {
					res.status(200).json({
						count: prods.length,
						products: prods
					});
				} else {
					res.json({ message: `Товары в категории: ${cat_title} не найдены !` })
				}
			}).catch(err => console.log(err));
			
});

module.exports = router;