const mongoose = require("mongoose"); 

const citySchema = mongoose.Schema({
    name: {type: String}, 
    country: {type: String}, 
    code: {type: String}, 
    country_id: { type: mongoose.Schema.Types.ObjectId, ref: "Country", index: true },
})

citySchema.index({ name: 1 });

module.exports = mongoose.model("City", citySchema);