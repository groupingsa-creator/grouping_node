 const express = require("express"); 

const router = express.Router(); 


const searhCtrl = require("../controllers/Search");

const auth = require("../middleware/auth");

router.get("/getsearch",auth, searhCtrl.getSearch); 

module.exports = router;