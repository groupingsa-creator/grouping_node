const mongoose =  require("mongoose");


const notificationSchema = mongoose.Schema({
  
    receiverId: {type: String}, 
    authorId: {type: String}, 
    title: {type: String}, 
    body: {type: String}, 
    date: {type: Date}, 
    read: {type: Boolean}, 
    view: {type: Boolean},
    annonceId: {type: String},
    desactived: {type: Boolean, default: false}
})


notificationSchema.index({ receiverId: 1, read: 1 });
notificationSchema.index({ receiverId: 1, authorId: 1, desactived: 1, date: -1 });
notificationSchema.index({ receiverId: 1, title: 1 });

module.exports = mongoose.model("Notification", notificationSchema);