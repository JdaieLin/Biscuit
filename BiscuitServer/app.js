var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

const BiscuitServer = require('./lib/BiscuitServer/BiscuitServer');
const biscuitServer = new BiscuitServer();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

app.use('/biscuitApi', biscuitServer.middleWare());
app.use('/biscuitApi', function(req, res, next){

	//使用req.query获得请求参数

	let query = req.query;
	console.log(query);

	//根据参数进行回复

	let name = query.name;
	if(name == "jdaie"){
		//回复数据（状态码默认为200）
		res.biscuit({
			name: "jdaie",
			say: "I'm here."
		});

	}else if(name == "allen"){
		//回复状态码和数据
		res.biscuit(666,{
			name: "allen",
			say: "Hi I am not at home"
		});

	}else{
		//回复状态码
		res.biscuit(301);
	}
});


let svg = `<svg width="17850625px" height="17850625px" xmlns="http://www.w3.org/2000/svg"></svg>`;

app.get('/demo', function(req, res, next) {
  res.contentType('image/svg+xml');
  res.send(svg);
})
  

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
