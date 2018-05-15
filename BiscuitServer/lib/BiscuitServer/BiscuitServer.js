

const sharp = require('sharp');
const Base64 = require('./Base64');

function BiscuitServer(){
	this.dataStore = {}
}

BiscuitServer.prototype.middleWare = function(){
	return (function(req, res, next){
		let tid = req.query._transactionID;
		let pid = req.query._parentID;
		let bid = req.query._blockID;
		let type = req.query._type;
		if(tid && type && !tid.indexOf("Biscuit") && type=="get"){
			res.biscuit = (function(context,tid,res){
				return function(arg1,arg2){
					if(arg1 && arg2){
						if(arg1 > 0 && arg1 <= 8192){
							context.sendHead(res,tid,arg1,arg2);
						}else{
							console.warn("Response code must a interger between 1 ~ 8192.");
						}
					}else if(arg1){
						if(arg1 > 0 && arg1 <= 8192){
							context.sendHead(res,tid,arg1);
						}else{
							console.warn("Response code must a interger between 1 ~ 8192. Send as data.");
							context.sendHead(res,tid,200,arg1);
						}
					}
				}
			})(this,tid,res);
			next();
		}else if(tid && pid && bid && type && !tid.indexOf("Biscuit") && type=="data"){
			this.sendDataBlock(req, res, next);
		}else{
			next();
		}
	}).bind(this);
}



BiscuitServer.prototype.sendDataBlock = function(req, res, next){
	let pid = req.query._parentID;
	let bid = req.query._blockID;
	let error = false;
	let dataset = this.dataStore["tid_"+pid];
	if(dataset){
		let blockArray = dataset.blocks;
		if(blockArray.length > 8192){
			console.warn("Data is too long!");
			this.dataStore["tid_"+pid] = null;
			let err = new Error('Data is too long!');
			err.status = 404;
			next(err);
		}
		if(bid == 0){
			this.sendDataWithImg(res,blockArray.length,1);
		}else{
			let i = bid - 1;
			if(i < blockArray.length){
				this.sendDataWithImg(res,blockArray[i][0],blockArray[i][1]);
			}else{
				error = true;
			}
			if(dataset.sendCount == dataset.blocks.length){
				this.dataStore["tid_"+pid] = null;
			}
		}
	}else{
		error = true;
	}
	if(error){
		let err = new Error('Not Found');
		err.status = 404;
		next(err);
	}
}

BiscuitServer.prototype.createData = function(tid,data){
	let dataString = JSON.stringify(data);
	let Base64String = Base64.encode(dataString);
	let blockArray = [];
	for(let i in Base64String){
		if(i%2){
			blockArray[blockArray.length-1].push(this.char2num(Base64String[i]));
		}else{
			blockArray.push([this.char2num(Base64String[i])]);
		}
	}
	if(blockArray[blockArray.length-1].length == 1){
		blockArray[blockArray.length-1].push(66);
	}
	this.dataStore["tid_"+tid] = {
		createTime: new Date().getTime(),
		blocks: blockArray,
		sendCount: 0
	}
}

BiscuitServer.prototype.char2num = function(c){
	return Base64._keyStr.indexOf(c)+1;
}

BiscuitServer.prototype.sendDataWithImg = function(res,p1,p2){
	let rtg = new Buffer(
	  '<svg><rect x="0" y="0" width="1" height="1"/></svg>'
	);
	sharp(rtg)
		.resize(p1,p2)
		.toBuffer()
		.then( data => {
			res.contentType('image/jpeg');
    		res.end(data);
		})
		.catch( err => {
			console.warn(err);
			res.json("error");
		});
}

BiscuitServer.prototype.sendHead = function(res,tid,code,data){
	let hasData = data?2:1;
	if(data){
		this.createData(tid,data);
	}
	this.sendDataWithImg(res,code,hasData);
}

BiscuitServer.prototype.sendSuccess = function(res){
	this.sendDataWithImg(res,ResponseCode.Ok,1);
}

BiscuitServer.prototype.sendSuccessWithData = function(res,tid,data){
	this.createData(tid,data);
	this.sendDataWithImg(res,ResponseCode.OK_WITH_DATA,1);
}

BiscuitServer.prototype.sendCustomCode = function(res,code){
	this.sendDataWithImg(res,code,1);
}

module.exports = BiscuitServer;