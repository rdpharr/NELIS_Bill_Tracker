const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

var indexRouter = require('./routes/index');
var billsRouter = require('./routes/bills');
var myBillsRouter = require('./routes/my_bills');
var singleBillRouter = require('./routes/get_bill');
var scrapeRouter = require('./routes/scrape');
var searchRouter = require('./routes/search');

var app = express();

// view engine setup
var hbs = require('hbs');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerHelper('dateFormat', require('handlebars-dateformat'));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/bills', billsRouter);
app.use('/my_bills', myBillsRouter);
app.use('/get_bill', singleBillRouter);
app.use('/scrape', scrapeRouter);
app.use('/search', searchRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
