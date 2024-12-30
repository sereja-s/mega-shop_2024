const Mysqli = require('mysqli');
/* const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); */

let conn = new Mysqli({
    host: 'localhost', // IP/domain name 
    post: 3306, // port, default 3306 
    user: 'root', // username 
    passwd: '12345', // password 
    db: 'mega-shop_2024'
});

let db = conn.emit(false, '');

module.exports = {
	database: db,
};