
使用passport实现认证模块
===================


认证模块是几乎所有web应用都需要的功能，主要解决谁是谁的问题；但写好一个认证模块却并不那么容易，对认证授权这套理论没有足够了解的话很容易就暴露出安全问题；认证的方式也越来越多，从最初的基于用户名+密码认证，到现在越来越多的第三方平台认证，光是支持几个流行的第三方平台就是不小的工作工作量；幸好已经有很多成熟的解决方案，既省了从头写的工作，安全性又有保障。 `passport` 是Nodejs中比较受欢迎的认证模块，可以跟`express` 无缝集成，今天使用了一下，看似简单，但还是花了不少时间才跑通。

----------
##生成应用骨架
不同类型的应用对文件的组织有不同的最佳实践，这里推荐使用[yo](http://yeoman.io/)，一个专门用于生成web应用基本结构的工具，来生成我们的应用。
```
//我们要生成express应用，使用以下命令，此命令需要先安装generator-express
yo express
```
按照提示选择需要的选项，最后会自动安装相关依赖。

## 安装passport
安装很简单：
```
npm install passport -S
```
加上`-S` 选项直接保存到`package.json` 
## 使用
```
var passport = require('passport');
//这里用passport-local，下面会有介绍
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
## Strategy
Passport支持不同类型的认证方式，从传统的基于用户名+密码表单的认证，到近几年流行的基于[OAuth](http://oauth.net/) 的社交网络帐号的认证，比如新浪微博，qq等，这是通过使用不同的Strategy实现的。比如上面例子中使用的`passport-local` strategy，提供的就是基于用户名+密码的认证方式；Passport目前提供超过300种不同的strategry，[这里](http://passportjs.org/)可以搜索所有支持的strategy。