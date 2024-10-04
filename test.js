const puppeteer = require("puppeteer");
const path = require("path");
const { gemini_prompt, openAi_prompt } = require("./src/utils/llm/helper");
const { sleep } = require("./src/utils/helper/helperFunction");
const cheerio = require("cheerio");
const fs = require("fs");
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
    const browser = await puppeteer.launch({ headless: false });
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

//functions------
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
      }, 20);
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
async function fetchHTML(url) {
  //ad block extension
  const extensionPath = path.join(__dirname, "MyExtension");

  const browser = await puppeteer.launch({
    headless: false,
  });
  try {
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
    const arrOfXpathToClose = [`//*[@id="alia-euey2oo952hs2o2u"]/div/svg`];
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
    let promptForFindingSelectors = `
        Analyze the following HTML in array of html and return Most accurate CSS selectors by tag or class or id or any attribute for the following in JSON format:
          {  
            reviewAll: <CSS selector for review_list or review_container that contains all reviews in the page. this element should and mandatory to include or wrapped all reviews elements in page.  >,
            review: <CSS selector without above "reviewAll" selector for each review parent element which contains child elements of review details like title , body , author , etc .>,
            title: <CSS selector for title element of each review in the page >,
            body:  <CSS selector for body content element of each review in the page >,
            rating:  <CSS selector for rating content element of each review in the page >,
            reviewer:  <CSS selector for author of each review in the page >,
            paginationNextBtn : <CSS selector for element that goto  next page of review if you find any selectors from ${arrOfNextPageSelectors} take it else check the css Selector  in DOM and make sure it is unique for single element and searching this cssSelector the result should be one element if not RETRY to generate new one .  >,
            currentPageCounter : <CSS selector for pager list element for page 1 element by default ,ie it will be current highlighted page counter return number 0 >,
            paginationList : <CSS selector for parent element of {paginationBtn} , it wraps all the page counter in pagination list>,
            totalNoOfPages : <Number value of total count of page if available in webpage if not availabe return number 0 >,
            popCloseBtnsArr : <Arr of string , value of strings will be CSS-SELECTOR for all the element with clickable or type action button to close the popup modal or any overlay window , i need this is array of string >
            }
        
        From Array of HTML content ${reviewElements}    
        `;

    console.log("Detecting selectors using Gemini LLM ... ");
    const cssSelectors = await gemini_prompt(promptForFindingSelectors);

    console.log("Generated selectors using LLM ✅ ");
    const parsedCssSelectors = JSON.parse(cssSelectors);
    console.log(parsedCssSelectors);

    let reviewFullData = [];
    let nextPageExists = true;
    var lastPageCount = 0;
    var x = 0;

    let prevData;

    while (nextPageExists) {
      const reviewData = await scrapeByCssSelector(page, parsedCssSelectors);
      if (JSON.stringify(prevData) == JSON.stringify(reviewData)) {
        // check whether this is last page or not .

        // const innerText = await page.evaluate((selector) => {
        //   // Query the element using its CSS selector
        //   const element = document.querySelector(selector); // Example: selecting an <h1> element
        //   return element ? element.innerText : null;
        // }, parsedCssSelectors.currentPageCounter);
        // console.log(innerText);
        console.log("Finished ... return data ");
        nextPageExists = false;
      }
      prevData = reviewData;
      reviewFullData = [...reviewFullData, ...reviewData];
      try {
        const btnNextPage = await page.$(parsedCssSelectors.paginationNextBtn);
        // const isBlocked = await checkElementIsBlocked(
        //   page,
        //   parsedCssSelectors.paginationNextBtn
        // );
        // if (isBlocked) {
        //   console.log(
        //     "it is blocked by overlay ................ Trying to close overlay/popup"
        //   );
        //   await closeOverlay(page, arrOfPopUpCloseButtons);
        // }
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
    console.log(reviewFullData);
    sleep(10000);

    if (reviewFullData.length == 0) {
      console.log("rerunning the selector finder");

      //getting All elements related see more review
      const elementsMatching_SeeMoreReviews =
        await getAllElementRelatesToSearch(page, [
          "see all reviews",
          "see more reviews",
          "more reviews",
        ]);
      reviewElements = [...reviewElements, ...elementsMatching_SeeMoreReviews];
      let promptForFindingSelectorsForSeeMoreReviewBtn = `
                Analyze the following HTML in array of html and return Most accurate CSS selectors by tag or class or id or any attribute for the following in JSON format:
                {  
                    seeReviewBtn: <CSS selector element having inner text like values  [ "SEE ALL REVIEWS" , "SEE MORE REVIEWS" , "MORE REVIEWS" etc... ] .>,
                    pagerList : <CSS selector for pager list element for all page count , should be parent of each page counter and children should be page1 , page2 ... so on >
                    }
                    
                    From Array of HTML content ${reviewElements}    
                    `;

      // Finding the selector for see more review btn
      const cssSelectorSeeMoreReviewBtn = JSON.parse(
        await gemini_prompt(promptForFindingSelectorsForSeeMoreReviewBtn)
      );
      console.log(cssSelectorSeeMoreReviewBtn);

      // clicking see more reviews
      console.log("clicking see more reviews");
      await page.click(cssSelectorSeeMoreReviewBtn.seeReviewBtn);

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
          reviewAll: <CSS selector for list or container that contains all reviews in the page. this element should and mandatory to include or wrapped all reviews elements in page. this should be precise by cssSelector .  >,
          review: <CSS selector for each review parent element which contains child elements of review details like title , body , author , etc .>,
          title: <CSS selector for title element of each review and  most probabling just above the body content of review ,the value wont be same as review of author . **higher chance check for something bold** , ignore if innerText == author name . >,
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
      console.log("New cssSelectors", newSelectors);
      const reviewData = await scrapeByCssSelector(page, newSelectors);
      console.log("Scrapped review Data ✅ ");
      console.log(reviewData);
    }
    // const html = await page.content();
    // console.log(html)
  } catch (error) {
    console.log(error);
  } finally {
    await browser.close();
  }
}

// fetchHTML("https://2717recovery.com/products/recovery-cream");
// fetchHTML("https://www.amazon.in/Wowon-Art-Fineliners-Calligraphy-Sketching/product-reviews/B0BFDW9D2W/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews");
// fetchHTML(
//   "https://bhumi.com.au/products/organic-cotton-flannelette-sheet-set-plaid"
// );
fetchHTML("https://lyfefuel.com/products/essentials-nutrition-shake");

// fetchHTML(
//   "https://www.flipkart.com/walkers-electronic-7in1-mobile-soldering-iron-equipment-tool-machine-combo-kit-set-flux-paste-5-meter-wire-25-w-simple/product-reviews/itm7f26d5189f1c4?pid=SOIFZUNFRYSMGVPX&lid=LSTSOIFZUNFRYSMGVPXOLEX1C&marketplace=FLIPKART"
// );
module.exports = { fetchHTML };

/**
 * 1.find the next btn
 *    then: click until last or disabled
 *    else:
 *      check for link
 *    else :
 *      check for page counter element
 */
