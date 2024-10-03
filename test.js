const puppeteer = require("puppeteer");
const { gemini_prompt } = require("./src/utils/llm/helper");
const { sleep } = require("./src/utils/helper/helperFunction");
async function scrapeByCssSelector(page, selectors) {
  // Launch Puppeteer and open a new browser page
  if (!page) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Go to the specified URL
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }

  // Define CSS selectors
  // Scrape the review data using the provided CSS selectors

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
  },selectors);
  // Close the browser
  //   await browser.close();

  return reviewsData;
}

async function fetchHTML(url) {
  const browser = await puppeteer.launch({ headless: false });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 100000 });
    let run = true;
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

    const grandparentSelectors = await page.evaluate(() => {
      // Select all elements to inspect, common containers, or the body tag
      const elements = document.querySelectorAll(
        "div, section, article, body,a, button, div, span"
      ); // Can adjust based on page structure
      const matchingGrandparents = [];

      elements.forEach((el) => {
        // Check if any of the descendant elements contain the word "review"
        const text = el.innerText.toLowerCase().trim();
        const options = ["see all reviews", "see more reviews", "more reviews"];
        if (options.includes(text)) {
          // If it contains "review", get the grandparent or higher-level element
          matchingGrandparents.push(el.outerHTML);
        }
      });
      return matchingGrandparents;
    });
    console.log(grandparentSelectors.length);
    reviewElements = [...reviewElements, ...grandparentSelectors];

    console.log("scrapped the review related elements ✅ ");
    let promptForFindingSelectors = `
        Analyze the following HTML in array of html and return Most accurate CSS selectors by tag or class or id or any attribute for the following in JSON format:
          {  
            reviewAll: <CSS selector for list or container that contains all reviews in the page. this element should and mandatory to include or wrapped all reviews elements in page.  >,
            review: <CSS selector for each review parent element which contains child elements of review details like title , body , author , etc .>,
            title: <CSS selector for title element of each review in the page >,
            body:  <CSS selector for body content element of each review in the page >,
            rating:  <CSS selector for rating content element of each review in the page >,
            reviewer:  <CSS selector for author of each review in the page >,
          }
        
        From Array of HTML content ${reviewElements}    
        `;
    console.log("Detecting selectors using LLM ... ");

    const cssSelectors = await gemini_prompt(promptForFindingSelectors);

    console.log("Generated selectors using LLM ✅ ");
    const parsedCssSelectors = JSON.parse(cssSelectors);
    console.log(parsedCssSelectors);
    const reviewData = await scrapeByCssSelector(page, parsedCssSelectors);
    console.log("Scrapped review Data ✅ ");
    console.log(reviewData);

    if (reviewData.length == 0) {
      let promptForFindingSelectorsForSeeMoreReviewBtn = `
        Analyze the following HTML in array of html and return Most accurate CSS selectors by tag or class or id or any attribute for the following in JSON format:
          {  
            seeReviewBtn: <CSS selector element having inner text like values  [ "SEE ALL REVIEWS" , "SEE MORE REVIEWS" , "MORE REVIEWS" etc... ] .>,
            pagerList : <CSS selector for pager list element for all page count , should be parent of each page counter and children should be page1 , page2 ... so on >
           }
        
        From Array of HTML content ${reviewElements}    
        `;
      const cssSelectorsBtn = await gemini_prompt(
        promptForFindingSelectorsForSeeMoreReviewBtn
      );
      console.log(cssSelectorsBtn);
      console.log("clicking see more reviews");
      await page.click(JSON.parse(cssSelectorsBtn).seeReviewBtn);
      let reviewElements_2 = await page.evaluate(() => {
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
      let promptForFindingSelectors_2 = `
      Analyze the following HTML in array of html and return Most accurate CSS selectors by tag or class or id or any attribute for the following in JSON format:
        {  
          reviewAll: <CSS selector for list or container that contains all reviews in the page. this element should and mandatory to include or wrapped all reviews elements in page.  >,
          review: <CSS selector for each review parent element which contains child elements of review details like title , body , author , etc .>,
          title: <CSS selector for title element of each review in the page >,
          body:  <CSS selector for body content element of each review in the page >,
          rating:  <CSS selector for rating content element of each review in the page >,
          reviewer:  <CSS selector for author of each review in the page >,
            paginationBtn : <CSS selector for pager list element for page 1  element which is clickable and siblings should be page 2 and page 3 so on >
          
         }
      
      From Array of HTML content ${reviewElements_2}    
      `;
      console.log("Detecting selectors using LLM ... ");

      const newSelectors = JSON.parse(
        await gemini_prompt(promptForFindingSelectors_2)
      );
      console.log(cssSelectors);
    }
    // const html = await page.content();
    // console.log(html)
  } catch (error) {
    console.log(error);
  } finally {
    await browser.close();
  }
}

fetchHTML("https://2717recovery.com/products/recovery-cream");
// fetchHTML(
//   "https://bhumi.com.au/products/organic-cotton-flannelette-sheet-set-plaid"
// );
// fetchHTML("https://lyfefuel.com/products/essentials-nutrition-shake");
module.exports = { fetchHTML };
