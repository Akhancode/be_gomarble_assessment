const fs = require("fs");
const { default: puppeteer } = require("puppeteer");
const { gemini_prompt } = require("../llm/helper");

function readJson(jsonFilePath) {
  const rawData = fs.readFileSync(jsonFilePath);
  return JSON.parse(rawData);
}

function writeJson(dataToStore, jsonFilePath) {
  const data = JSON.stringify(dataToStore, null, 2);
  fs.writeFileSync(jsonFilePath, data);
}

//function for reusing scrape HTML content
async function scrapeHTML(url) {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // get full page html
    const htmlContent = await page.content();
    await browser.close();
    return htmlContent;
  } catch (err) {
    console.error(`Error scraping URL: ${err}`);
    return null;
  }
}

async function scrapeByCssSelector(url, selectors) {
  // Launch Puppeteer and open a new browser page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Go to the specified URL
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Scrape the review data using the provided CSS selectors
  const reviews = await page.$$eval(
    selectors.reviewAll,
    (reviewNodes, selectors) => {
      return reviewNodes.map((reviewNode) => {
        console.log("reviewNode", reviewNode);
        return {
          title:
            reviewNode.querySelector(selectors.title)?.innerText || "No Title",
          body:
            reviewNode.querySelector(selectors.body)?.innerText || "No Body",
          rating:
            reviewNode.querySelector(selectors.rating)?.innerText ||
            "No Rating",
          reviewer:
            reviewNode.querySelector(selectors.reviewer)?.innerText ||
            "Anonymous",
        };
      });
    },
    selectors
  );

  // Close the browser
  await browser.close();

  return reviews;
}
const selectorsx = {
  reviewAll: ".yotpo-review",
  review: ".yotpo-review-ph",
  title: ".yotpo-review-title",
  body: ".yotpo-review-content",
  rating: ".yotpo-star-rating .yotpo-star-rating__star.active",
  reviewer: ".yotpo-reviewer-name",
  nextBtn: "#yotpo-reviews-container > div > nav > div > a:nth-child(3)",
};
async function scrapeReviews(url, selectorsx) {
  var lastPageCount = 0;
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "load" });

  let reviewsArr = [];
  let nextPageExists = true;
  while (nextPageExists) {
    // Scrape the reviews on the current page
    const reviewElements = await page.$$(selectorsx.reviewAll);

    const reviews = await Promise.all(
      reviewElements.map(async (element) => {
        // Example: Extracting the text from each review
        const title = await element.$eval(
          selectorsx.title,
          (node) => node.innerText
        ); // Replace with actual child selectors
        const body = await element.$eval(
          selectorsx.body,
          (node) => node.innerText
        );
        // const rating = await element.$eval('.review-rating', node => node.innerText);
        const reviewer = await element.$eval(
          selectorsx.reviewer,
          (node) => node.innerText
        );

        return { title, body, reviewer };
      })
    ).then((rev) => {
      reviewsArr = [...reviewsArr, ...rev];
    });

    // console.log("running")
    // Check for a "next" button to go to the next page
    const element = await page.$(selectorsx.nextBtn);
    if (!element) {
      console.log("Element not found");
      nextPageExists = null;
    } else {
      // Check if the element is disabled
      const isDisabled = await page.$eval(selectorsx.nextBtn, (el) => {
        return (
          el.hasAttribute("disabled") ||
          el.disabled ||
          el.classList.contains("disabled")
        );
      });
      if (isDisabled && lastPageCount == 0) {
        lastPageCount = lastPageCount + 1;
        continue;
      }

      if (isDisabled && lastPageCount > 0) {
        console.log("Element is disabled");
        nextPageExists = null;
      } else {
        console.log("Element is enabled, clicking...");
        await element.click(); // Click the element if it's enabled
      }
    }
  }
  console.log(reviewsArr.map((o) => o.reviewer));
  await browser.close();
  return reviewsArr;
}
async function scrapeReviewsByLLM(url) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "load" });

  let reviewsArr = [];
  let nextPageExists = true;
  let lastPageCount = 0;

  while (nextPageExists) {
    // Scrape the reviews on the current page
    const reviewElements = await page.$$(selectorsx.review_el_all);

    const reviews = await Promise.all(
      reviewElements.map(async (element) => {
        // Example: Extracting the text from each review
        const title = await element.$eval(
          selectorsx.title,
          (node) => node.innerText
        ); // Replace with actual child selectors
        const body = await element.$eval(
          selectorsx.body,
          (node) => node.innerText
        );
        // const rating = await element.$eval('.review-rating', node => node.innerText);
        const reviewer = await element.$eval(
          selectorsx.reviewer,
          (node) => node.innerText
        );
        const htmlBlock = await page.evaluate((el) => el.outerHTML, element);

        return { title, body, reviewer, htmlBlock };
      })
    ).then((rev) => {
      reviewsArr = [...reviewsArr, ...rev];
    });

    // console.log("running")
    // Check for a "next" button to go to the next page
    const element = await page.$(selectorsx.nextBtn);

    if (!element) {
      nextPageExists = null;
    } else {
      // Check if the element is disabled
      const isDisabled = await page.$eval(
        selectorsx.nextBtn,
        (el) =>
          el.hasAttribute("disabled") ||
          el.disabled ||
          el.classList.contains("disabled")
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
        await element.click(); // Click the element if it's enabled
      }
    }
  }
  const allReviews = reviewsArr.map((obj) => obj.htmlBlock);
  const prompt = `Analyze the following HTML and scrape all text value for the review section, review title, body, rating, and reviewer in the following JSON format:
  
  {
    "title": "< text value for review title content >",
    "body": "< text value for review body content >",
    "rating": "< text value for review rating content >",
    "reviewer": "< text value for reviewer name content >",
    }
    
    here HTML content in Array of object as each review as object dont loose any scrape full object : ${allReviews}`;
  let response = await gemini_prompt(prompt);
  await browser.close();

  console.log("response", response.length);
  return JSON.parse(response);
}

async function getCSSByLLM(url) {
  const scrappedHTML = await scrapeHTML(url);
  const prompt = `Analyze the following HTML and return Most accurate CSS selectors by tag or class or id or any attribute for the review section reviewAll,
and nextBtn in the following JSON format:
{
  "reviewAll": "<CSS selector  for all review parent container block of html element >",
  "nextBtn": "<CSS selector generate a css selector for the review pagination next button>",

}
HTML content: ${scrappedHTML}
response only in json 
`;
  // HTML url: ${url}

  let response = await gemini_prompt(prompt);
  return JSON.parse(response);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const parseBoolean = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return false;
};
module.exports = {
  sleep,
  readJson,
  writeJson,
  scrapeHTML,
  scrapeByCssSelector,
  scrapeReviews,
  scrapeReviewsByLLM,
  getCSSByLLM,
  parseBoolean,
};
