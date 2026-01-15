const express = require("express");
const router = express.Router();
const articlesController = require("../controllers/articlesController");

// index
router.get("/", articlesController.index);

// show
router.get("/:slug", articlesController.show);

// store
router.put("/", articlesController.store);

// update
router.patch("/:id", articlesController.update);

//ceckout
router.post("/checkout", articlesController.checkout);

module.exports = router;
