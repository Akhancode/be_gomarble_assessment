const bhumi_com = {
  cssSelectors: {
    review: ".CarouselWidget .R-ReviewsList__item",
    title: ".R-ReviewsList__item .R-TextHeading--xxs",
    body: ".R-ReviewsList__item .R-TextBody--xs",
    rating: ".R-ReviewsList__item .R-RatingStars__stars",
    reviewer: ".R-ReviewsList__item .cssVar-authorName",
  },
  link: `https://bhumi.com.au/products/organic-cotton-flannelette-sheet-set-plaid`,
};

const selectorsForFineTuning = {
  amazon: {
    reviewAll: ".EKFha-",
    review: ".col.EPCmJX.Ma1fCG",
    title: ".z9E0IG",
    body: ".ZmyHeo div div",
    rating: ".XQDdHH.Ga3i8K",
    reviewer: ".AwS1CA",
    paginationNextBtn: ".WSL9JP a._9QVEpD",
    currentPageCounter: ".WSL9JP a.cn++Ap.A1msZJ",
    paginationList: ".WSL9JP",
    totalNoOfPages: "2",
    popCloseBtnsArr: ["._1F9SL9"],
  },
  flipkart: {
    reviewAll: ".JxFEK3._48O0EI",
    review: ".col.EPCmJX.Ma1fCG",
    title: ".z9E0IG",
    body: ".ZmyHeo div div",
    rating: ".XQDdHH.Ga3i8K",
    reviewer: ".AwS1CA",
    paginationNextBtn: ".WSL9JP a._9QVEpD",
    currentPageCounter: ".WSL9JP a.cn++Ap.A1msZJ",
    paginationList: ".WSL9JP",
    totalNoOfPages: "2",
    popCloseBtnsArr: ["._1F9SL9"],
  },
};
module.exports = { bhumi_com };
