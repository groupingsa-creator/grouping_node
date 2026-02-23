  const mongoose = require("mongoose"); 

const AnnouncementSchema = mongoose.Schema({
    
    startCity: {type: String}, 
    endCity: {type: String}, 
    startCity2: {type: Object}, 
    endCity2: {type: Object}, 
    dateOfDeparture: {type: Date}, 
    kilosCount: {type: Number}, 
    kiloPrice: {type : Number }, 
    company: {type: String}, 
    description: {type: String}, 
    pieds: {type: Number},
    userId: {type: String}, 
    user: {type: Object},
    draft: {type: Array},
    status: {type: String}, 
    date: {type: Date}, 
    active: {type: Boolean},
    priceKilo: {type: String, default: null},
    coords: {type: Object, default: null},
    locked: {type: Boolean, default: null}, 
    views: {type: Number}, 
    read: {type: Boolean, default: false}, 
    devise: {type: String}, 
    fileName: {type: String}, 
    fileType: {type: String}, 
    modifyDate: {type: Date}, 
    nomdutransiaire: {type: String}
    
    
})

AnnouncementSchema.index({ userId: 1, active: 1, status: 1, date: -1 });
AnnouncementSchema.index({ active: 1, status: 1, dateOfDeparture: -1, date: -1 });
AnnouncementSchema.index({ startCity: 1, endCity: 1, dateOfDeparture: 1, status: 1, active: 1 });
AnnouncementSchema.index({ userId: 1, read: 1, active: 1 });

AnnouncementSchema.pre('save', function(next) {
    if (this.kiloPrice && typeof this.kiloPrice === 'string') {
        // Remplacer la virgule par un point
        this.kiloPrice = parseFloat(this.kiloPrice.replace(',', '.'));
    }
    next();
});


module.exports = mongoose.model("Announcement", AnnouncementSchema); 