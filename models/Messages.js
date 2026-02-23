const mongoose = require('mongoose'); 

const messageSchema = mongoose.Schema({
    text: { type: String }, 
    date: { type: Date }, 
    user1Id: { type: String }, 
    user2Id: { type: String }, 
    id_annonce: { type: String },  // champ facultatif ajouté
    read: {type: Boolean, default: false}, 
    type: {type: String}, 
    url: {type: String}
})

messageSchema.index({ user1Id: 1, user2Id: 1, date: -1 });
messageSchema.index({ user2Id: 1, date: -1 });
messageSchema.index({ user2Id: 1, read: 1 });

module.exports = mongoose.model("Message", messageSchema);
