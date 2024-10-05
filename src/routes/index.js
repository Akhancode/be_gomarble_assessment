const express = require("express");
const router = express();

const reviewRoute = require("./reviews.route");


router.use("/api/reviews",reviewRoute);



module.exports = router;
