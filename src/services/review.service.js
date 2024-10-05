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

const headlessValue = parseBoolean(process.env.ISHEADLESS);
//functions------
const cleaningHtml = async (page) => {
  const htmlContent = await page.content();
  const $ = cheerio.load(htmlContent);

  // Remove all <script> and <style> tags
  $("script").remove();
  $("style").remove();
  $("img").remove();

  // Optionally remove other unwanted elements (e.g., ads, popups)
  $(".ad").remove(); // Example class for ads
  $(".popup").remove(); // Example class for popups

  // Return the cleaned HTML
  const cleanedHtml = $.html().replace(/\s\s+/g, " ").replace(/\n/g, "").trim();

  return cleanedHtml;
};
const checkElementIsBlocked = async (page, targetSelector) => {
  const isBlocked = await page.evaluate((targetSelector) => {
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      return false; // Element doesn't exist
    }

    // Get the bounding box of the target element
    const { top, left, width, height } = targetElement.getBoundingClientRect();

    // Get the element at the center of the target element
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const elementFromPoint = document.elementFromPoint(centerX, centerY);

    // Check if the element at the center of the target element is the target element itself
    return elementFromPoint !== targetElement;
  }, targetSelector);
  return isBlocked;
};

async function scrapeByCssSelector(page, selectors, url) {
  // Launch Puppeteer and open a new browser page
  if (!page) {
    const browser = await puppeteer.launch({
      headless: headlessValue,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }

  const reviewsData = await page.evaluate((selectors) => {
    // Get all review elements
    const reviewElements = document.querySelectorAll(
      `${selectors.reviewAll} ${selectors.review}`
    );

    // Loop through each review element and extract data
    const reviewsArray = Array.from(reviewElements).map((reviewElement) => {
      const title =
        reviewElement.querySelector(selectors.title)?.innerText || "No Title";
      const body =
        reviewElement.querySelector(selectors.body)?.innerText || "No Content";
      const rating =
        reviewElement.querySelector(selectors.rating)?.innerText || "No Rating";
      const reviewer =
        reviewElement.querySelector(selectors.reviewer)?.innerText ||
        "Anonymous";

      return {
        title,
        body,
        rating,
        reviewer,
      };
    });

    return reviewsArray;
  }, selectors);

  return reviewsData;
}
async function scrapeByLLMByReviewTile(page, selectors, url) {
  // Launch Puppeteer and open a new browser page
  if (!page) {
    const browser = await puppeteer.launch({
      headless: headlessValue,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }

  const reviewsData = await page.evaluate((selectors) => {
    // Get all review elements
    const reviewElements = document.querySelectorAll(
      `${selectors.reviewAll} ${selectors.review}`
    );

    // Loop through each review element and extract data
    const reviewsArray = Array.from(reviewElements).map((reviewElement) => {
      // const title =
      //   reviewElement.querySelector(selectors.title)?.innerText || "No Title";
      // const body =
      //   reviewElement.querySelector(selectors.body)?.innerText || "No Content";
      // const rating =
      //   reviewElement.querySelector(selectors.rating)?.innerText || "No Rating";
      // const reviewer =
      //   reviewElement.querySelector(selectors.reviewer)?.innerText ||
      //   "Anonymous";
      const reviewBlock = document.querySelector(selectors.review);
      const reviewBlockHtml = reviewBlock ? reviewBlock.outerHTML : null;
      return {
        htmlBlock: reviewBlockHtml,
      };
    });

    return reviewsArray;
  }, selectors);

  return reviewsData;
}
const getAllElementRelatesToSearch = async (
  page,
  searchArr = ["see all reviews", "see more reviews", "more reviews"]
) => {
  const elementsRelatedToSeeMoreReviesArr = await page.evaluate((searchArr) => {
    // Select all elements to inspect, common containers, or the body tag
    const elements = document.querySelectorAll(
      "div, section, article, body,a, button, div, span"
    ); // Can adjust based on page structure
    const matchingGrandparents = [];

    elements.forEach((el) => {
      // Check if any of the descendant elements contain the word "review"
      const text = el.innerText.toLowerCase().trim();
      const options = searchArr;
      if (options.includes(text)) {
        // If it contains "review", get the grandparent or higher-level element
        matchingGrandparents.push(el.outerHTML);
      }
    });
    return matchingGrandparents;
  }, searchArr);
  return elementsRelatedToSeeMoreReviesArr;
};
const getAllReviewAttributeElement = async (page) => {
  let reviewElements = await page.evaluate(() => {
    // Use querySelectorAll to find all elements whose id, class, or attributes contain "review"
    const reviewElements = document.querySelectorAll(`
                    [id*="review"],
                    [class*="review"],
                    [data-*="review"],
                    [name*="review"]
                `);

    // Convert NodeList to an array and return the outer HTML of each element
    return Array.from(reviewElements).map((element) => element.outerHTML);
  });
  return reviewElements;
};
const getAllPaginationAttributeElement = async (page) => {
  let reviewElements = await page.evaluate(() => {
    // Use querySelectorAll to find all elements whose id, class, or attributes contain "review"
    const reviewElements = document.querySelectorAll(`
                    [id*="pagina"],
                    [id*="page"],
                    [class*="pagina"],
                    [class*="page"],
                    [data-*="pagina"],
                    [data-*="page"],
                    [name*="pagina"],
                    [name*="page"]
                `);

    // Convert NodeList to an array and return the outer HTML of each element
    return Array.from(reviewElements).map((element) => element.outerHTML);
  });
  return reviewElements;
};
const scrollToBottom = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
};
const closeOverlay = async (page, closeButtonSelectors) => {
  for (const selector of closeButtonSelectors) {
    try {
      const isVisible = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element
          ? element.offsetWidth > 0 || element.offsetHeight > 0
          : false;
      }, selector);

      if (isVisible) {
        // await page.waitForSelector(selector);
        await page.click(selector);
        console.log("clicked close buttonn.....", selector);
        // Wait for the overlay to be removed or hidden
        continue; // Exit the loop after closing the first found overlay
      }
    } catch (error) {
      // Ignore errors (e.g., element not found or not clickable)
      console.warn(`Error handling selector ${selector}: ${error.message}`);
      continue;
    }
  }
};

// main function------
async function scrapePage(url, scapeByLLM = false) {
  const pptOption = {
    headless: headlessValue,
    args: ["--no-sandbox"],
    
  };
  if(process.env.NODE == "production"){
    pptOption["executablePath"]="/usr/bin/chromium-browser"
  }
  console.log(pptOption)
  const browser = await puppeteer.launch(pptOption);
  try {
    scapeByLLM
      ? console.log("Initiated scrapping type  by 'LLM' ⌛ ")
      : console.log("Initiated scrapping type  by 'CSS SELECTORS' ⌛ ");
    const arrOfNextPageSelectors = [
      ".jdgm-paginate__next-page",
      '.yotpo-reviews-pagination-item[aria-label="Goto next page"]',
    ];
    const arrOfPopUpCloseButtons = [
      `[data-testid="CloseIcon"]`,
      `button.klaviyo-close-form.kl-private-reset-css-Xuajs1[aria-label="Close dialog"]`,
      ".store-selection-popup--inner .store-selection-popup--close",
      `[data-testid="CloseIcon"]`,
      `button[aria-label="Close dialog"]`,
      `[data-testid*="Close"]`,
    ];
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 50000 });
    await scrollToBottom(page);
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
        if (currPageNo > Number(parsedCssSelectors.totalNoOfPages)) {
          console.log("Finished ... return data ");
          nextPageExists = false;
          prevData = [];
        }
      }
      prevData.push(JSON.stringify(reviewData));
      reviewFullData = [...reviewFullData, ...reviewData];
      currPageNo++;
      try {
        const btnNextPage = await page.$(parsedCssSelectors.paginationNextBtn);
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

    console.log("Scrapped review Data ✅ ");
    if (scapeByLLM) {
      const prompt = generate_promptForScrappingFromReviewBlock(reviewFullData);
      let response = JSON.parse(await gemini_prompt(prompt));
      console.log(response);
      return response;
    } else {
      console.log(reviewFullData);
      return reviewFullData;
    }
  } catch (error) {
    console.log(error);
    return error;
  } finally {
    await browser.close();
  }
}

//new - servie
exports.NewScrapeForProductReviews = async (url, scapeByLLM) => {
  const data = await scrapePage(url, scapeByLLM);
  return data;
};
