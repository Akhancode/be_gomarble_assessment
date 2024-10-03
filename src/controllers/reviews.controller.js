const reviewService = require("../services/review.service");

//MANAGE Plan - Plan TABLE

exports.getReviews = async (req, res, next) => {
  try {
    // await subscriptionsService.getUserSubscriptionDetailsByIdPublic(req, res,next);
    const url = req.query.page 
    if(!url){
      throw  `query url is mandatory !!`
    }
    const response = await reviewService.getProductReviews(
      url
    );
    res.json(response)

  } catch (err) {
    next(err);
  }
};
exports.getTestReviews = async (req, res, next) => {
  try {
    // await subscriptionsService.getUserSubscriptionDetailsByIdPublic(req, res,next);
    const url = req.query.page 
    if(!url){
      throw  `query url is mandatory !!`
    }
    const response = await reviewService.testProductReviews(
      url
    );
    res.json(response)

  } catch (err) {
    next(err);
  }
};

