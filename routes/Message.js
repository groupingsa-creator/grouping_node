const express = require("express"); 

const router = express.Router(); 

const messageCtrl = require("../controllers/Message"); 
const auth = require("../middleware/auth"); 
const multer2 = require("../middleware/multer-configs2");

router.post("/getmessages", auth, messageCtrl.getMessages);
router.post("/getMessagesById", auth, messageCtrl.getMessagesById);
router.post("/addmessage", auth, messageCtrl.addMessage);
router.get("/getconversationcount", auth, messageCtrl.getConversationCount);
router.post("/addmessagewithimage", auth, multer2, messageCtrl.addMessageWithImage); 

module.exports = router;