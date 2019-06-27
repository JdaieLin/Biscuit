/**
 * Biscuit.js
 * Create by Jdaie Lin. May 2018
 */

const Base64 = require("./Base64")
const app = getApp()

function Biscuit(option) {
  this.context = option.context
  this.host = option.host
  this.path = option.path
  this.debug = option.debug
  this.plateName = option.plateName || "$plate"
  this.clientName = option.clientName || "$client"
  this.clientNameGlobal = option.clientNameGlobal || "$biscuitClient"
  this.context.data[this.plateName] = []
  this.context[this.clientName] = this
  this.tidCleanList = []
  this.activeRequestNum = 0
  app.globalData[this.clientNameGlobal] = this
}

Biscuit.responseCode = {
  OK: 200,
  OK_WITH_DATA: 201
}

Biscuit.prototype.get = function (opt) {
  if (!opt.data)
    opt.data = {}
  opt.data._transactionID = this.getTransactionID()
  opt.data._type = "get"
  let dataString = []
  for (let i in opt.data) {
    dataString.push(i + "=" + encodeURIComponent(opt.data[i]))
  }
  opt.type = "get"
  opt.tid = opt.data._transactionID
  opt.src = this.host + this.path + "?" + dataString.join("&")
  this.activeRequestNum++
  this.pushToConnectPool(opt)
}

Biscuit.prototype.getDataHead = function (pid) {
  let opt = {}
  opt.data = {}
  opt.data._transactionID = this.getTransactionID()
  opt.data._parentID = pid
  opt.data._blockID = 0
  opt.data._type = "data"
  let dataString = []
  for (let i in opt.data) {
    dataString.push(i + "=" + encodeURIComponent(opt.data[i]))
  }
  opt.type = "data"
  opt.tid = opt.data._transactionID
  opt.parentID = pid
  opt.blockID = 0
  opt.src = this.host + this.path + "?" + dataString.join("&")
  this.pushToConnectPool(opt)
}

Biscuit.prototype.getDataBlocks = function(pid) {
  let parent = this.getRequsetById(pid)
  let opts = []
  for (let i = 1; i <= parent.responseData.dataLength; i++){
    let opt = {}
    opt.data = {}
    opt.data._transactionID = this.getTransactionID()
    opt.data._parentID = pid
    opt.data._blockID = i
    opt.data._type = "data"
    let dataString = []
    for (let i in opt.data) {
      dataString.push(i + "=" + encodeURIComponent(opt.data[i]))
    }
    opt.type = "data"
    opt.tid = opt.data._transactionID
    opt.parentID = pid
    opt.blockID = i
    opt.src = this.host + this.path + "?" + dataString.join("&")
    opts.push(opt)
  }
  this.pushToConnectPoolBatch(opts)
}

Biscuit.prototype.pushToConnectPool = function (opt) {
  let pool = this.getRequsetList()
  pool.push(opt)
  pool["id_"+opt.tid] = pool[pool.length-1]
  this.context.setData({
    [this.plateName]: pool
  })
}

Biscuit.prototype.pushToConnectPoolBatch = function (opts) {
  let pool = this.getRequsetList()
  for (let i in opts){
    pool.push(opts[i])
    pool["id_" + opts[i].tid] = pool[pool.length - 1]
  }
  this.context.setData({
    [this.plateName]: pool
  })
}

Biscuit.prototype.poolEvent = function (e) {
  let tid = e.target.dataset.tid
  let type = e.target.dataset.type
  let pid = e.target.dataset.parentId
  let bid = e.target.dataset.blockId
  if(e.detail.errMsg){
    let request = this.getRequsetById(tid)
    request.done = true
    request.error = e.detail.errMsg
    if(type == "data"){
      let parent = this.getRequsetById(pid) || {}
      parent.done = true
      parent.error = "Sub request error: " + e.detail.errMsg
      this.finishRequest(pid)
    }else{
      this.finishRequest(tid)
    }
  }else{
    let { width, height } = e.detail
    if(type == "get"){
      this.processGetResponse(tid,[width,height])
    }else{
      this.processDataResponse(tid,[width, height],pid,bid)
    }
  }
}

Biscuit.prototype.processGetResponse = function(tid, data){
  let responseData = {}
  let request = this.getRequsetById(tid)
  responseData.code = data[0] - 1
  responseData.hasData = (data[1]==2)
  request.responseData = responseData
  if(responseData.hasData){
    this.getDataHead(tid)
  }else{
    this.finishRequest(tid)
  }
}

Biscuit.prototype.processDataResponse = function(tid, data, pid, bid) {
  let parent = this.getRequsetById(pid)
  let request = this.getRequsetById(tid) 
  if(!parent) return
  if(bid == 0){
    //dataHead
    parent.responseData.dataLength = data[0]
    parent.responseData.level = data[1]
    parent.responseData.startTime = new Date().getTime()
    if(this.debug)
      console.warn("Get data block length :" + data[0])
    this.getDataBlocks(pid)
    request.done = true
  }else{
    //dataBlock
    parent.responseData.rawArray = parent.responseData.rawArray || []
    if (parent.responseData.rawArrayLength == null){
      parent.responseData.rawArrayLength = 0
    }
    let rawArray = parent.responseData.rawArray
    let dataLevel = parent.responseData.level
    rawArray[bid - 1] = this.decodeData(data[0], dataLevel) + this.decodeData(data[1], dataLevel)
    parent.responseData.rawArrayLength = 0
    request.done = true
    for (let i in rawArray){
      if (rawArray[i] !== null)
        parent.responseData.rawArrayLength += 1
    }
    if (parent.responseData.rawArrayLength == parent.responseData.dataLength){
      this.finishDataRequest(pid)
    }
  }
}

Biscuit.prototype.finishDataRequest = function(tid){
  let request = this.getRequsetById(tid)
  let rawArray = request.responseData.rawArray
  let base64String = rawArray.join("")
  request.responseData.data = JSON.parse(Base64.decode(base64String))
  request.responseData.base64String = base64String
  request.responseData.endTime = new Date().getTime()
  request.responseData.spendTime = request.responseData.endTime - request.responseData.startTime
  this.finishRequest(tid)
}

Biscuit.prototype.finishRequest = function(tid){
  let request = this.getRequsetById(tid)
  if (request.error && request.fail){
    request.responseData = {
      error: request.error,
      requestData:request.data
    }
    request.fail(request.responseData)
  }else{
    request.responseData.requestData = request.data
    request.success(request.responseData)
  }
  request.done = true
  if (request.type == "get"){
    if(this.debug)
      console.warn("Finishing request: " + request.src)
    this.pushToCleanList(tid)
    this.activeRequestNum--
    this.cleanCheck()
  }
}

Biscuit.prototype.pushToCleanList = function(tid){
  this.tidCleanList.push(tid)
}

Biscuit.prototype.cleanCheck = function(){
  if (!this.activeRequestNum){
    if(this.debug)
      console.warn("Clean plate.")
    for (let i in this.tidCleanList) {
      this.cleanRequest(this.tidCleanList[i])
    }
    this.tidCleanList = []
  }
}

Biscuit.prototype.cleanRequest = function(tid){
  let pool = this.getRequsetList()
  let newPool = []
  for(let i=0;i<pool.length;i++){
    if (!(pool[i].tid != tid || pool[i].parentID != tid)){
      newPool.push(pool[i])
      newPool["id_" + pool[i].tid] = newPool[newPool.length - 1]
    }
  }
  this.context.setData({
    [this.plateName]: newPool
  })
}

Biscuit.prototype.getRequsetList = function () {
  return this.context.data[this.plateName]
}

Biscuit.prototype.getRequsetById = function(tid){
  return this.context.data[this.plateName]["id_" + tid]
}

Biscuit.prototype.decodeData = function(digt, dataLevel){
  let result = ''
  let resultArray = [digt]
  let currentLevel = dataLevel
  while (currentLevel > 1) {
    currentLevel --
    let tempArray = []
    resultArray.map(item => {
      let num1 = Math.floor(item / Math.pow(67, currentLevel))
      let num2 = item % Math.pow(67, currentLevel)
      tempArray.push (num1, num2)
    })
    resultArray = tempArray
  }
  // console.log(resultArray)
  resultArray.map(item => {
    result += (item <= 65) ? Base64._keyStr[item - 1] : ""
  })
  return result
}

Biscuit.prototype.getTransactionID = function () {
  return this.getUid()
}

Biscuit.prototype.getUid = function() {
  return ("Biscuit-" + this.S4() + "-" + this.S4() + this.S4() + this.S4())
}

Biscuit.prototype.S4 = function() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
}

module.exports = Biscuit