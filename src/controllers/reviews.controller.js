const reviewService = require("../services/review.service");
const { parseBoolean } = require("../utils/helper/helperFunction");


exports.getReviews = async (req, res, next) => {
  try {
    const url = req.query.page 
    const scrapeByLLM = parseBoolean(req.query.scrapeByLLM)
    if(!url){
      throw  `query url is mandatory !!`
    }
    const response = await reviewService.NewScrapeForProductReviews(
      url,scrapeByLLM
    );
    res.json(response)

  } catch (err) {
    next(err);
  }
};


