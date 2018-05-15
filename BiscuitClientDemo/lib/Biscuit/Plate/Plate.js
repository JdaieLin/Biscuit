// Plate.js
// Create by Jdaie Lin. May 2018

const app = getApp()

Component({
  properties: {
    plate:{
      type: Array,
      value: [],
      observer: function(newVal, oldVal){
      }
    },
    clientNameGlobal: {
      type: String,
      value: "$biscuitClient",
      observer: function (newVal, oldVal) {
      }
    }
  },
  methods: {
    loadHandler: function(e){
      const client = app.globalData[this.properties.clientNameGlobal]
      if (client.debug)
        console.warn("Response loaded.")
      client.poolEvent(e)
    },
    errorHandler: function(e){
      const client = app.globalData[this.properties.clientNameGlobal]
      if (client.debug)
        console.warn("Response Error.")
      client.poolEvent(e)
    }
  }
})
