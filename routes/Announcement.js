const express = require("express"); 

const router = express.Router(); 

const announcementCtrl = require("../controllers/Announcement"); 

const auth = require("../middleware/auth");
const { handleMultipleImages, handlePdfUpload } = require("../middleware/multer");

router.post("/addannouncement", auth, handlePdfUpload, handleMultipleImages, announcementCtrl.addAnnouncement);
router.post("/addannouncementwithpdf", auth, handlePdfUpload, announcementCtrl.addAnnouncementWithPdf);
router.post("/addannouncementwithImages", auth, handleMultipleImages, announcementCtrl.addAnnouncementWithImages)
router.get("/getannouncementbyid", auth, announcementCtrl.getAnnouncementsById); 
router.post("/announces", announcementCtrl.getAnnonces);
router.post("/moreannounces", auth, announcementCtrl.moreAnnouncements)
router.post("/getannonce", announcementCtrl.getAnnonce)
router.post("/getannoncee", announcementCtrl.getAnnoncee)
router.post("/search", auth, announcementCtrl.annoncesRecherche)
router.get("/getvalidannouncements", auth, announcementCtrl.getValidAnnouncements)
router.get("/getfalsecontainer", auth, announcementCtrl.getFalseContainer)
router.get("/getfalsekilo", auth, announcementCtrl.getFalseKilo)
router.get("/getconversionrate", auth, announcementCtrl.getConversionRate)
router.post("/updateactivecontainer", auth, announcementCtrl.toggleActiveStatus);
router.post("/updatetransitaire", auth, announcementCtrl.updateTransitaire);
router.post("/avoirlesannonces", announcementCtrl.avoirLesAnnonces);
router.post("/ajouterunconteneur", auth, handleMultipleImages, announcementCtrl.addAnnouncementWithImages);
router.post("/modifierannonceimg", auth, handleMultipleImages, announcementCtrl.modifierAnnonceImage)
router.post("/modifierannoncepdf", auth, handlePdfUpload, announcementCtrl.modifierAnnonceImage)
router.post("/modifierkilo", auth, announcementCtrl.modifierUneAnnonceKilo);
router.post("/cleanbrokenurls", auth, announcementCtrl.cleanBrokenDraftUrls);
router.post("/updateactivecontainerwithfile", auth, handlePdfUpload, announcementCtrl.toggleActiveStatusWithFile);
router.post("/updateactivecontainerwithimage", auth, handleMultipleImages, announcementCtrl.toggleActiveStatusWithImage);
router.post("/departsimminents", announcementCtrl.getDepartsImminents);


module.exports = router;


 
