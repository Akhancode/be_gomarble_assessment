const subscriptionsService = require("../services/test.service");

//MANAGE Plan - Plan TABLE

exports.testController = async (req, res, next) => {
  try {
    // await subscriptionsService.getUserSubscriptionDetailsByIdPublic(req, res,next);
    await subscriptionsService.test(
      req,
      res,
      next
    );
  } catch (err) {
    next(err);
  }
};

