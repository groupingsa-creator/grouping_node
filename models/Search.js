const mongoose = require("mongoose");

const searchSchema = mongoose.Schema({
  
     startCity : {type: String}, 
     endCity: {type: String}, 
     month: {type: String}, 
     year: {type: String}, 
     type: {type: String}, 
     userId: {type: String},
     date: {type: Date}
    
})

module.exports = mongoose.model("Search", searchSchema)