
使用passport实现认证模块
===================


认证模块是几乎所有web应用都需要的功能，主要解决谁是谁的问题；但写好一个认证模块却并不那么容易，对认证授权这套理论没有足够了解的话很容易就暴露出安全问题；认证的方式也越来越多，从最初的基于用户名+密码认证，到现在越来越多的第三方平台认证，光是支持几个流行的第三方平台就是不小的工作工作量；幸好已经有很多成熟的解决方案，既省了从头写的工作，安全性又有保障。 `passport` 是Nodejs中比较受欢迎的认证模块，可以跟`express` 无缝集成，今天使用了一下，看似简单，但还是花了不少时间才跑通。
接下来我们将从头开始生成一个叫passport-demo的简单web应用，基于express，演示基本的passport的用法。

----------
##生成应用骨架
不同类型的应用对文件的组织有不同的最佳实践，这里推荐使用[yo](http://yeoman.io/)，一个专门用于生成web应用基本结构的工具，来生成我们的应用。
```
//安装yo
sudo npm install -g yo
//我们要生成express应用，需要先安装generator-express
npm install generator-exrepss
//安装gulp作为构建工具
sudo npm install -g gulp
//使用yo生成express应用基本骨架
yo express
```
按照提示选择需要的选项，最后会自动安装相关依赖。一切就绪后，输入`gulp` 就可以启动应用；在浏览器中输入 `http://localhost:3000` 可以看到生成的示例页面。

## 安装passport
安装很简单：
```
npm install passport -S
```
加上`-S` 选项直接保存到`package.json` 
## 使用
### 生成登陆页面
使用[bootstrap](http://getbootstrap.com/) 可以方便的生成看起来比较专业的界面，但我们这里不打算使用任何的css，只用最少的代码演示最基本的用法。
```
<!DOCTYPE html>
<html>
	<head>
		<title>passport demo</title>
	</head>
	<body>
		<form action="/login" method="post">
			<div>
				<label>Username</label>
				<input type="text" name="username"/>
			</div>
			<div>
				<label>Password</label>
				<input type="password" name="password"/>
			</div>
			<input type="submit" value="Login"/>
		</form>
		<br>
	</body>
</html>

```
这个页面只包含一个用户名输入框，一个密码输入框，以及一个提交按钮； 注意，用户名输入框的`name`必须是"username", 密码的`name`必须是"password"，这样后台处理的时候直接可以建立对应关系，否则就必须多一步配置。表单提交后由`/login` 对应的服务处理。

### 后台处理
以下是完整的后台代码。
```
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
//因为我们用的是基于用户名+密码的登陆方法，所以使用'passport-local' strategy
var Strategy = require('passport-local').Strategy;

passport.use(new Strategy(function(username, password, cb) {
	//认证成功，将用户信息放入第2个参数
	if (username === 'admin' && password === 'pass') {
		cb(null, {
			id : username
		});
	} else {
		//认证失败，第2个参数是false
		cb(null, false);
	}
}));
//将用户信息持久化到session中，这里的users就是上面认证成功后callback的第2个参数;在本例中，passport将把用户id TODO: more detail
passport.serializeUser(function(users, cb) {
	cb(null, users.id);
});
//将用户信息从session中提取出来 TODO: more detail
passport.deserializeUser(function(user1, cb) {
	cb(null, {
		id : user1
	});
});

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended : true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-session')({
	secret : "secret a",
	resave : false,
	saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

app.post('/login', passport.authenticate('local', {
	failureRedirect : '/login-local.html'
}), function(req, res) {
	res.redirect('/');
});

app.use('/', routes);

module.exports = app;

```
## Strategy
Passport支持不同类型的认证方式，从传统的基于用户名+密码表单的认证，到近几年流行的基于[OAuth](http://oauth.net/) 的社交网络帐号的认证，比如新浪微博，qq等，这是通过使用不同的Strategy实现的。比如上面例子中使用的`passport-local` strategy，提供的就是基于用户名+密码的认证方式；Passport目前提供超过300种不同的strategry，[这里](http://passportjs.org/)可以搜索所有支持的strategy。
TODO: local-strategy的执行过程