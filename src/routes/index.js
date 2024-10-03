const express = require("express");
const router = express();

const testRoute = require("./test.route");
const reviewRoute = require("./reviews.route");


router.use("/api",testRoute);
router.use("/api/reviews",reviewRoute);



module.exports = router;
