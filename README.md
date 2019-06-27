# Biscuit 
#### 饼干服务器
Biscuit可以让微信小程序直接与服务器ip进行http通讯，避开域名校验。

例如访问："http://192.168.100.20/users"

注意：Biscuit原理是通过批量的空白图片的宽高来传输数据，只适用于传递轻量级的json数据/字符串/数字。

### 小程序端使用方法
在小程序页面wxml文件和json文件中引入Plate控件
```
<!--index.wxml-->

<Plate plate="{{$plate}}"></Plate>
```

```
//index.json

{
  "usingComponents": {
    "Plate": "../../lib/Biscuit/Plate/Plate"
  }
}
```

页面js中引入Biscuit
```
//index.js

const app = getApp()
const Biscuit = require('../../lib/Biscuit/Biscuit.js')
let biscuit

Page({
  data: {
  },
  onLoad: function () {
    
    const page = this
    
    //建立client实例
    biscuit = new Biscuit({
      context: page,
      host: "http://127.0.0.1:3000",
      path: "/biscuitApi"
    })

    //请求示例
    biscuit.get({
      data: {
        name: "jdaie"
      },
      success: function(res){
        console.log(res)
        if(res.hasData) 
          console.log("Recieve data : ", res.data)
      },
      fail: function(data){
        console.log(data)
      }
    })
  }
})
```

### 服务器端（node-express）使用方法

```
//创建实例
const BiscuitServer = require('./lib/BiscuitServer/BiscuitServer');
const biscuitServer = new BiscuitServer();

...

//在对应的路径上配置biscuitServer中间件
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
			say: "Not at home."
		});
	}else{
		//回复状态码
		res.biscuit(301);
	}
});

```

### 工作原理
小程序的图片请求不需要校验域名，所以Biscuit通过图片请求的宽高来传递数值。Biscuit图片请求分为get和data两种类型。

get类型中，宽度代表回复码(可自行定义1-8192之间的整数)，高度为1表示无数据，为2表示携带数据。如果携带数据，则会发起data类型的请求。

data类型中，bid(BlockID)为0时，返回图片宽度数值为data所需要的图片请求数量，高度为数据位数（67进制）。bid大于0时，返回图片的宽高数据经过位数解析，得到对应Base64字符串的数组。


