const express = require("express");
const  reviewController = require("../controllers/reviews.controller");

const router = express.Router();

router.get("/", async (req, res, next) => {
    reviewController.getReviews(req,res,next)
});
router.get("/test", async (req, res, next) => {
    reviewController.getTestReviews(req,res,next)
});

module.exports = router;
