const express = require("express");
const  testController = require("../controllers/test.controller");

const router = express.Router();

router.get("/test", async (req, res, next) => {
    testController.testController(req,res,next)
});

module.exports = router;
