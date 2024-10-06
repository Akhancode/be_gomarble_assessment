const reviewService = require("../services/review.service");
const { parseBoolean } = require("../utils/helper/helperFunction");

exports.getReviews = async (req, res, next) => {
  try {
    const url = req.query.page;
    const scrapeByLLM = parseBoolean(req.query.scrapeByLLM);
    const multiProcess = parseBoolean(req.query.multiProcess);
    if (!url) {
      throw `query url is mandatory !!`;
    }
    if (multiProcess) {
      const response = await reviewService.NewScrapeForProductReviewsWithChild(
        url,
        scrapeByLLM
      );
      res.json(response);
      return;
    } else {
      const response = await reviewService.NewScrapeForProductReviews(
        url,
        scrapeByLLM
      );
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};
