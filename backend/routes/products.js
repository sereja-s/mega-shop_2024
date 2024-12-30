const express = require('express');
const router = express.Router();

// Получим объект БД
const {database} = require('../config/helpers');

// 1) Получим маршрут ко всем товарам постранично:
// Sending Page Query Parameter is mandatory http://localhost:3636/api/products?page=1

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

module.exports = router;