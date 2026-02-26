const express = require("express"); 
const mongoose = require("mongoose");

const fs = require("fs");
const cors = require('cors');
const path = require("path");

const app = express();
app.use(cors());
require('dotenv').config();

app.use(express.json({limit: "50mb"})); 
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');

    next();
});

mongoose.connect(`mongodb+srv://fideleNdzime:${process.env.MONGOPASS}@cluster0.rb7vp80.mongodb.net/grouping?retryWrites=true&w=majority`,

  { useNewUrlParser: true,
    useUnifiedTopology: true, autoIndex: true })
  .then(async () => {
    console.log('Connexion à MongoDB réussie !');

    // Migration one-shot : initialiser fcmToken à [] pour les anciens users
    const User = require("./models/User");
    const result = await User.updateMany(
      { $or: [{ fcmToken: { $exists: false } }, { fcmToken: null }] },
      { $set: { fcmToken: [] } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Migration fcmToken : ${result.modifiedCount} utilisateur(s) mis a jour.`);
    }

    // Nettoyage des URLs cassées (double extension .pdf/.jpg/.png<timestamp>)
    const Announcement = require("./models/Announcement");
    const cleanResult = await Announcement.updateMany(
      { "draft.0": { $regex: /\.(pdf|jpg|jpeg|png)_?\d+\.(pdf|jpg|jpeg|png)$/ } },
      { $set: { draft: [] } }
    );
    if (cleanResult.modifiedCount > 0) {
      console.log(`Nettoyage: ${cleanResult.modifiedCount} annonces avec URLs cassees corrigees`);
    }
  })
  .catch((err) => console.log('Connexion à MongoDB échouée !', err));


const cityRouter = require("./routes/City");
const userRouter = require("./routes/User");
const countryRouter = require("./routes/Country"); 
const announcementRouter = require("./routes/Announcement"); 
const messageRouter = require("./routes/Message");
const notificationRouter = require("./routes/Notification");
const searchRouter = require("./routes/Search");
const tokenRouter = require("./routes/DeviceToken");
const trackingRouter = require("./routes/Tracking");


app.use("/api/country", countryRouter)
app.use("/api/city", cityRouter); 
app.use("/api/user", userRouter);
app.use('/pdf_documents', express.static(path.join(__dirname, 'pdf_documents')));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api/annonce", announcementRouter);
app.use("/api/message", messageRouter); 
app.use("/api/notification", notificationRouter);
app.use("/api/search", searchRouter);
app.use("/api/token", tokenRouter);
app.use("/api/tracking", trackingRouter);

module.exports = app;