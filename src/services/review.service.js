const puppeteer = require("puppeteer");
const path = require("path");

const cheerio = require("cheerio");
const fs = require("fs");
const { sleep, parseBoolean } = require("../utils/helper/helperFunction");
const { gemini_prompt } = require("../utils/llm/helper");
const {
  generate_promptForFindingSelectors,
  generate_promptForScrappingFromReviewBlock,
} = require("../utils/prompts/prompts");
const { fork } = require("child_process");
const {
  cleaningHtml,
  checkElementIsBlocked,
  scrapeByCssSelector,
  scrapeByLLMByReviewTile,
  scrollToBottom,
  closeOverlay,
  scrollIntoELement,
  formatResponseReview,
} = require("../utils/helper/scraperHelperFunctions");
const headlessValue = parseBoolean(process.env.ISHEADLESS);
//functions------

// main function------
async function scrapePage(url, scapeByLLM = false) {
  const pptOption = {
    headless: headlessValue, // Set to true for headless mode
  };
  const pptOption_2 = {
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    userDataDir:"C:\\Users\\assessment\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1"
  }
  const node_env = process.env.NODE_ENV
  const browser = await puppeteer.launch((node_env=="production")?pptOption_2:pptOption);
  try {
    scapeByLLM
      ? console.log("Initiated scrapping type  by 'LLM' ⌛ ")
      : console.log("Initiated scrapping type  by 'CSS SELECTORS' ⌛ ");
    const arrOfNextPageSelectors = [
      ".jdgm-paginate__next-page",
      '.yotpo-reviews-pagination-item[aria-label="Goto next page"]',
    ];
    let arrOfPopUpCloseButtons = [
      `[data-testid="CloseIcon"]`,
      `button.klaviyo-close-form.kl-private-reset-css-Xuajs1[aria-label="Close dialog"]`,
      ".store-selection-popup--inner .store-selection-popup--close",
      ".MuiSvgIcon-root.MuiSvgIcon-fontSizeInherit",
      `[data-testid="CloseIcon"]`,
      `button[aria-label="Close dialog"]`,
      `[data-testid*="Close"]`,
    ];
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 50000 });
    await scrollToBottom(page);
    await sleep(10000);
    await closeOverlay(page, arrOfPopUpCloseButtons);

    //getting All elements related review Attribute
    let reviewElements = await cleaningHtml(page);

    // let pageElements = await getAllPaginationAttributeElement(page);

    // Saving to txt file HTML
    // fs.writeFileSync("cleaned_output.txt", String(reviewElements), "utf8");

    console.log("scrapped html content of review related elements ✅ ");
    let promptForFindingSelectors = generate_promptForFindingSelectors(
      reviewElements,
      arrOfNextPageSelectors
    );

    console.log("Detecting selectors using Gemini LLM ... ");
    const cssSelectors = await gemini_prompt(promptForFindingSelectors);

    console.log("Generated selectors using LLM ✅ ");
    const parsedCssSelectors = JSON.parse(cssSelectors);
    console.log(parsedCssSelectors);
    arrOfPopUpCloseButtons = [
      ...arrOfPopUpCloseButtons,
      ...parsedCssSelectors.popCloseBtnsArr,
    ];
    if (url.includes("lyfefuel.com")) {
      const rall = await page.$(".r-view-all");

      await scrollIntoELement(rall, page);
      await page.click(".r-view-all");
      parsedCssSelectors["paginationNextBtn"] =
        ".isActive.R-PaginationControls__item.Pagination__item--outline+div";
    }

    let reviewFullData = [];
    let nextPageExists = true;
    var lastPageCount = 0;
    let prevData = [];
    let currPageNo = 1;

    // Pagination handling
    while (nextPageExists) {
      const reviewData = scapeByLLM
        ? await scrapeByLLMByReviewTile(page, parsedCssSelectors)
        : await scrapeByCssSelector(page, parsedCssSelectors);
      if (prevData.includes(JSON.stringify(reviewData))) {
        console.log("first", !url.includes("lyfefuel.com"), url);
        let pageOver = currPageNo > Number(parsedCssSelectors.totalNoOfPages);
        if (pageOver && !url.includes("lyfefuel.com")) {
          console.log("Finished ... return data duplicate");
          nextPageExists = false;
          prevData = [];
        }
      }
      prevData.push(JSON.stringify(reviewData));
      reviewFullData = [...reviewFullData, ...reviewData];
      currPageNo++;
      try {
        const btnNextPage = await page.$(parsedCssSelectors.paginationNextBtn);
        await scrollIntoELement(btnNextPage, page);

        if (!btnNextPage) {
          console.log("btnNextPage not found");
          nextPageExists = null;
        } else {
          // Check if the btnNextPage is disabled
          const isDisabled = await page.$eval(
            parsedCssSelectors.paginationNextBtn,
            (el) => {
              return (
                el.hasAttribute("disabled") ||
                el.disabled ||
                el.classList.contains("disabled")
              );
            }
          );
          if (isDisabled && lastPageCount == 0) {
            lastPageCount = lastPageCount + 1;
            continue;
          }

          if (isDisabled && lastPageCount > 0) {
            console.log("Element is disabled");
            nextPageExists = null;
          } else {
            console.log("Element is enabled, clicking...");
          }
          await btnNextPage.click();
        }
        await sleep(1000);
      } catch (error) {
        console.log("retrying to click");
        const isBlocked = await checkElementIsBlocked(
          page,
          parsedCssSelectors.paginationNextBtn
        );
        console.log("isBlocked by overlay : ", isBlocked);
        await closeOverlay(page, arrOfPopUpCloseButtons);
      }
    }

    if (scapeByLLM) {
      const prompt = generate_promptForScrappingFromReviewBlock(reviewFullData);
      console.log(
        "Scrapping review Data for filtered block of html code ⌛..."
      );
      let response = JSON.parse(await gemini_prompt(prompt));
      console.log(response);
      console.log("Scrapped review Data ✅ ");
      
      return formatResponseReview(response);
    } else {
      console.log(reviewFullData);
      console.log("Scrapped review Data ✅ ");
      return formatResponseReview(reviewFullData);;
    }
  } catch (error) {
    console.log(error);
    return error;
  } finally {
    await browser.close();
  }
}

//new - service
const NewScrapeForProductReviews = async (url, scapeByLLM) => {
  const data = await scrapePage(url, scapeByLLM);
  return data;
};
const NewScrapeForProductReviewsWithChild = async (url, scapeByLLM) => {
  console.log("multi threading ......");
  return new Promise((resolve, reject) => {
    const child = fork(path.join(__dirname, "../workers/scrapeWorker.js"), [
      url,
      scapeByLLM,
    ]);

    // Handle messages from child process
    child.on("message", (message) => {
      resolve(message);
    });

    // Handle errors
    child.on("error", (error) => {
      reject(error);
    });

    // Handle child process exit
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Child process exited with code ${code}`));
      }
    });
  });
};

module.exports = {
  scrapePage,
  NewScrapeForProductReviewsWithChild,
  NewScrapeForProductReviews,
};
