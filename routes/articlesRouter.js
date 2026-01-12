const express = require("express");
const router = express.Router();
const articlesController = require("../controllers/articlesController");

// index
router.get("/", articlesController.index);

// show
router.get("/:id", articlesController.show);

// store
router.put("/", articlesController.store);

module.exports = router;
