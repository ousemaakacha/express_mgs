const express = require("express");
const router = express.Router();
const articlesController = require("../controllers/articlesController");

//index
router.get("/", articlesController.index);

// show
router.get("/:id", articlesController.show);

/*
// update
router.put("/:id", articlesController.update);
*/
module.exports = router;
