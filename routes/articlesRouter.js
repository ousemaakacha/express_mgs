const express = require("express");
const router = express.Router();
const articlesController = require("../controllers/articlesController");

// index
router.get("/", articlesController.index);

// show
router.get("/:id", articlesController.show);

// store
router.put("/", articlesController.store);

// update
router.put("/:id", articlesController.update);

//ceckout
router.post("/checkout", articlesController.checkout);

module.exports = router;
