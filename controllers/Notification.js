const Notification = require("../models/Notification"); 


exports.viewNotifications = async (req, res) => {
  
  try{
      
    await Notification.updateMany({receiverId: req.auth.userId}, {$set: {view: true}}); 
    
    res.status(200).json({status: 0})
    
  }catch(err){
    
    console.log(err); 
    res.status(505).json({err})
  }
  
    
}

exports.getNotReadNotifications = async(req, res) => {
    
  
    
    try{
      
      const badges = await Notification.countDocuments({receiverId: req.auth.userId, read: false}); 
      
      res.status(201).json({status: 0, badges});
      
    }catch(err){
      
        console.log(err); 
        res.status(505).json({err})
    }
}