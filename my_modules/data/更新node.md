更新node版本
=================
今天打算安装一下`yo`，结果发现自己的node版本太低，于是google了一下，发现一种比较方便地更新node的方式：用npm （目前不支持Windows）
1. 清除npm缓存
    `sudo npm cache clean -f `
2. 安装node管理模块n
    `sudo npm install n -g`
3. 安装需要安装的版本
    `sudo n 0.10.26`
    或者直接安装到最新的稳定版本
    `sudo n stable`
赫然发现node最新版本已经是4.0.0了，要知道前几年一直是在0.x之前，看来node也开始采用激进的发展策略了。
    


> Written with [StackEdit](https://stackedit.io/).