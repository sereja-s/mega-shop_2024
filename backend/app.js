const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const app = express();

app.use(cors({
	origin: '*',
	methods: ['GET', 'PUT', 'DELETE', 'PATCH', 'POST'],
	allowedHeaders: 'Content-Type, Authorization, Origin, X-Requested-With, Accept'
}));

app.use(logger('combined'));
//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Import Routes
//const indexRouter = require('./routes/index');
const productsRouter = require('./routes/products');
const usersRouter = require('./routes/users');

// Use Routes
//app.use('/', indexRouter);
app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);

module.exports = app;