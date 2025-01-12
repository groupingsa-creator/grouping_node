const mongoose =  require("mongoose");


const notificationSchema = mongoose.Schema({
  
    receiverId: {type: String}, 
    author_id: {type: String}, 
    
})