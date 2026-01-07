const express = require("express"); 

const router = express.Router(); 
const { handleUpload } = require("../middleware/multer");

const messageCtrl = require("../controllers/Message"); 
const auth = require("../middleware/auth"); 

router.post("/getmessages", auth, messageCtrl.getMessages);
router.post("/getMessagesById", auth, messageCtrl.getMessagesById);
router.post("/addmessage", auth, messageCtrl.addMessage);
router.get("/getconversationcount", auth, messageCtrl.getConversationCount);
router.post("/addmessagewithimage", auth, handleUpload, messageCtrl.addMessageWithImage); 



module.exports = router;