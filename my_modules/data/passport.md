
使用passport实现登陆模块
===================


登陆模块是几乎所有web应用都需要的功能，但写好一个登陆模块却并不是一个简单的工作，对认证授权没有足够了解的话很容易就暴露出安全问题；登陆的方式也越来越多，从最初的基于用户名+密码登陆，到现在越来越多的第三方平台登陆，光是支持几个流行的第三方平台就是不小的工作工作量；幸好已经有很多成熟的解决方案，既省了从头写的工作，安全性又高。 `passport` 是Nodejs中比较受欢迎的认证模块，今天使用了一下，看似简单，但还是花了不少时间才跑通。

----------
#### 安装
安装很简单：
```
npm install passport -S
```
加上`-S` 选项直接保存到`package.json` 
#### 使用
```
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
//初始化工作一定要放在前面
app.use(passport.initialize());
//通常都需要将用户信息持久化到session中，否则每个请求都需要登陆
app.use(passport.session());

//如果是基于用户名+密码登陆，就用Local Strategy
passport.use(new Strategy({
	passReqToCallback : true
}, function(req, username, password, cb) {
	//这里的userService是用户自定义的module，可以自己实现用户名密码的比对逻辑
	var user = userService.authenticate(username, password);
	if (user) {
		var user = {
			username : username,
			id : user.id
		};
		cb(null, user);
	} else {
		cb(null, false);
	}
}));
//将用户信息持久化到session,这里只保存用户id
passport.serializeUser(function(user, cb) {
	cb(null, user.id);
});
//
passport.deserializeUser(function(id, cb) {
	var user = userService.findById(id);
	if (user)
		cb(null, user);
	else
		cb('Failed to authenticate.');
});
```
#### Stragtegy