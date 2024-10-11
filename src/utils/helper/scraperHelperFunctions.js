const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

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
      }, 150);
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

async function scrollIntoELement(element, page) {
  if (element) {
    // Scroll to the element
    await page.evaluate((el) => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, element);

    console.log(`Scrolled to the Next `);
  } else {
    console.log(`Element not found`);
  }
}
const formatResponseReview = (data) => {
  return {
    reviews_count: data?.length,
    reviews: data,
  };
};
//deprecated- functions
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
module.exports = {
  cleaningHtml,
  checkElementIsBlocked,
  scrapeByCssSelector,
  scrapeByLLMByReviewTile,
  scrollToBottom,
  closeOverlay,
  scrollIntoELement,
  formatResponseReview,
};
