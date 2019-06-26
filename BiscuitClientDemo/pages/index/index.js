/**
 * Biscuit Cient Demo
 * Created by Jdaie Lin.
 */

const app = getApp()
const Biscuit = require('../../lib/Biscuit/Biscuit.js')
let biscuit

Page({
  data: {

  },
  onLoad: function () {

    //建立client实例
    const page = this
    biscuit = new Biscuit({
      context: page,
      host: "http://127.0.0.1:3000",
      path: "/biscuitApi"
    })

    //请求示例
    biscuit.get({
      data: {
        name: "allen"
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

    //请求示例2
    biscuit.get({
      data: {
        name: "unknow"
      },
      success: function (res) {
        console.log(res)
        if (res.hasData)
          console.log("Recieve data : ", res.data)
      },
      fail: function (data) {
        console.log(data)
      }
    })
  },
  bindtap: function(e){
    //请求示例3
    biscuit.get({
      data: {
        name: "allen"
      },
      success: function (res) {
        console.log(res)
        if (res.hasData)
          console.log("Recieve data : ",res.data)
      },
      fail: function (data) {
        console.log(data)
      }
    })
  }
})
