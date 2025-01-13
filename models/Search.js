const mongoose = require("mongoose");

const searchSchema = mongoose.Schema({
  
     startCity : {type: String}, 
     endCity: {type: String}, 
     month: {type: String}, 
     year: {type: String}, 
     type: {type: Boolean}, 
     userId: {type: String}
  
    
})

module.exports = mongoose.model("Search", searchSchema)