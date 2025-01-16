const mongoose = require("mongoose");

const searchSchema = mongoose.Schema({
  
     startCity : {type: String}, 
     endCity: {type: String}, 
     month: {type: String}, 
     year: {type: String}, 
     status: {type: String}, 
     userId: {type: String},
     date: {type: Date},
     done: { type: Boolean, default: false },
    
})

module.exports = mongoose.model("Search", searchSchema)