const mongoose = require("mongoose"); 

const viewSchema = mongoose.Schema({
    
    phoneId: {type: String}, 
    date: {type: Date}, 
    announcementId: {type: String}
    
})


viewSchema.index({ announcementId: 1, phoneId: 1 });

module.exports = mongoose.model("View", viewSchema);