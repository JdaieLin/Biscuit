/**
 * Created by Jdaie Lin.
 * data level support 1 ~ 3
 */

const Base64 = require('./Base64')
const dataLevel = 3
const maxLength = 33554428

function BiscuitServer(){
	this.dataStore = {}
}

BiscuitServer.prototype.middleWare = function(){
	return (function(req, res, next){
		let tid = req.query._transactionID
		let pid = req.query._parentID
		let bid = req.query._blockID
		let type = req.query._type
		if(tid && type && !tid.indexOf("Biscuit") && type=="get"){
			res.biscuit = (function(context,tid,res){
				return function(arg1,arg2){
					if(arg1 && arg2){
						if(arg1 >= 0 && arg1 <= maxLength - 1){
							context.sendHead(res, tid, arg1 + 1, arg2)
						}else{
							console.warn(`Response code must a interger between 0 ~ 33554427.`)
						}
					}else if(arg1 != null){
						if(arg1 >= 0 && arg1 <= maxLength - 1){
							context.sendHead(res, tid, arg1 + 1)
						}else{
							console.warn("Response code must a interger between 0 ~ 33554427. Send as data.")
							context.sendHead(res, tid, 200, arg1)
						}
					}
				}
			})(this,tid,res)
			next()
		}else if(tid && pid && bid && type && !tid.indexOf("Biscuit") && type=="data"){
			this.sendDataBlock(req, res, next)
		}else{
			next()
		}
	}).bind(this)
}



BiscuitServer.prototype.sendDataBlock = function(req, res, next){
	let pid = req.query._parentID
	let bid = req.query._blockID
	let error = false
	let dataset = this.dataStore["tid_"+pid]
	if(dataset){
		let blockArray = dataset.blocks
		if(blockArray.length > maxLength - 1){
			console.warn("Data is too long!")
			this.dataStore["tid_"+pid] = null
			let err = new Error('Data is too long!')
			err.status = 404
			next(err)
		}
		if(parseInt(bid) === 0){
      // send data head
			this.sendDataWithImg(res,blockArray.length, dataset.level)
		}else{
			// send data block
			let i = bid - 1
			if(i < blockArray.length){
				this.sendDataWithImg(res,blockArray[i][0],blockArray[i][1])
			}else{
				error = true
			}
			if(dataset.sendCount === dataset.blocks.length){
				this.dataStore["tid_"+pid] = null
			}
		}
	}else{
		error = true
	}
	if(error){
		let err = new Error('Not Found')
		err.status = 404
		next(err)
	}
}

BiscuitServer.prototype.createData = function(tid, data, level){
	let dataString = JSON.stringify(data)
	let Base64Num = Base64.encode(dataString).split('').map(i => this.char2num(i))
	let blockArray = []
	let currentlevel = 1
	let emptyNum = 66
	while (currentlevel < level) {
		let tempArray = []
		emptyNum = 66 * Math.pow(67, currentlevel - 1) + emptyNum
		if (Base64Num.length % 2) Base64Num.push(emptyNum)
		Base64Num.map((item, index, arr) => {
			if (index % 2 && arr[index-1] !== null) tempArray.push(arr[index-1] * Math.pow(67, currentlevel) + item)
		})
    Base64Num = tempArray
		currentlevel ++
	}
	switch (level) {
		case 1:
      emptyNum = 66
			break
		case 2:
			emptyNum = 4488
			break
		case 3:
      emptyNum = 20151120
			break
		default:
			break
	}
  if (Base64Num.length % 2) Base64Num.push(emptyNum)

  for(let i in Base64Num){
		 if(i%2){
			 blockArray[blockArray.length-1].push(Base64Num[i])
		 }else{
			 blockArray.push([Base64Num[i]])
		 }
	 }
	 // console.log(blockArray)

	this.dataStore["tid_"+tid] = {
		createTime: new Date().getTime(),
		blocks: blockArray,
		sendCount: 0,
		level: level
	}
}

BiscuitServer.prototype.char2num = function(c){
	return Base64._keyStr.indexOf(c) + 1
}

BiscuitServer.prototype.sendDataWithImg = function(res,p1,p2){
	res.contentType('image/svg+xml')
	res.send(`<svg width="${p1}px" height="${p2}px" xmlns="http://www.w3.org/2000/svg"></svg>`)
}

BiscuitServer.prototype.sendHead = function(res,tid,code,data){
	let hasData = data ? 2 : 1
	if (data) {
		this.createData(tid, data, dataLevel)
	}
	this.sendDataWithImg(res, code, hasData)
}

module.exports = BiscuitServer