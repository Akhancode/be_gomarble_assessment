const OpenAI = require("openai");
const productsData = require("../utils/data/products.json");
const {
  DatabaseError,
  ValidationError,
  NotFoundError,
} = require("../utils/errors/error");

const fs = require("fs");
const path = require("path");
const {
  readJson,
  writeJson,
  scrapeHTML,
  scrapeByCssSelector,
  scrapePagination,
  scrapeReviews,
  scrapeReviewsByLLM,
  getCSSByLLM,
} = require("../utils/helper/helperFunction");
const { default: axios } = require("axios");
const { gemini_prompt } = require("../utils/llm/helper");
const { json } = require("body-parser");
const { bhumi_com } = require("../utils/constants/testData");
const cheerio = require("cheerio");
const { fetchHTML } = require("../../test");

const productsFilePath = path.join(__dirname, "../utils/data/products.json");
exports.createProduct = async (productData) => {
  if (!productData.name) {
    throw new ValidationError("Product Name is required.");
  }
  if (!productData.price) {
    throw new ValidationError("Product price is required.");
  }

  try {
    const productsData = readJson(productsFilePath);
    productsData.push(productData);
    writeJson(productsData, productsFilePath);
    return {
      message: `created new product `,
      success: true,
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    } else {
      throw new DatabaseError("Error creating user.");
    }
  }
};

exports.getProducts = async () => {
  try {
    const productsData = readJson(productsFilePath);
    return productsData;
  } catch (error) {
    throw new DatabaseError("Error fetching products.");
  }
};
exports.getProductById = async (_productId) => {
  try {
    const productId = Number(_productId);
    const productsData = readJson(productsFilePath);
    var foundIndex = productsData.findIndex(
      (product) => product.id == productId
    );
    const resultData = productsData[foundIndex];
    if (!resultData) {
      throw new NotFoundError("No product found by this id");
    }
    return resultData;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    } else {
      throw new DatabaseError("Error fetching products.");
    }
  }
};
exports.updateProductById = async (_productId, updateData) => {
  try {
    const productId = Number(_productId);
    const productsData = readJson(productsFilePath);
    var foundIndex = productsData.findIndex(
      (product) => product.id == productId
    );
    const resultData = productsData[foundIndex];

    if (!resultData) {
      throw new NotFoundError("No product found by this id");
    }
    let updatedProductDetails = { ...resultData, ...updateData };
    productsData[foundIndex] = updatedProductDetails;
    writeJson(productsData, productsFilePath);

    return updatedProductDetails;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    } else {
      throw new DatabaseError("Error updating  product.");
    }
  }
};
exports.deleteProductById = async (_productId) => {
  try {
    const productId = Number(_productId);
    const productsData = readJson(productsFilePath);
    var foundIndex = productsData.findIndex(
      (product) => product.id == productId
    );
    const resultData = productsData[foundIndex];
    if (!resultData) {
      throw new NotFoundError("No product found by this id / already deleted");
    }

    productsData.splice(foundIndex, 1);
    writeJson(productsData, productsFilePath);

    return {
      message: "Deleted Successfully . ",
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    } else {
      throw new DatabaseError("Error creating user.");
      throw new DatabaseError("Error updating  product.");
    }
  }
};

exports.getProductReviews = async (url) => {
  try {
    // const productsData = "html"
    
    if (!url) {
      url = `https://lyfefuel.com/products/essentials-nutrition-shake`;
    }
    const scrappedHTML = await scrapeHTML(url);
    const prompt = `Analyze the following HTML and return CSS selectors for the review section, review title, body, rating, and reviewer in the following JSON format:
{
  "reviewAll": "<CSS selector  for all review parent container which is direct >",
  "review": "<CSS selector for each review container >",
  "title": "<CSS selector for review title content >",
  "body": "<CSS selector for review body content >",
  "rating": "<CSS selector for review rating content >",
  "reviewer": "<CSS selector for reviewer name content >",
  "nextBtn": "<CSS selector for next button in pagination might be label as next page or something . >",
  "nextBtnTxt": "<Text content for next button in pagination if no text existing give value not existing or svg >",

  }
HTML content: ${scrappedHTML}`;

    let response = await gemini_prompt(prompt);
    // response = response.replace("```json", "").replace("```", "");
    let selectors = JSON.parse(response);
    console.log("selectors", selectors);
    return selectors;
    const result = await scrapeByCssSelector(url, selectors);
    console.log(result);
    // const openai = new OpenAI({
    //   apiKey:process.env.OPENAI_API_KEY,
    // });
    // console.log(process.env.OPENAI_API_KEY)
    // const response = await openai.completions.create({
    //   messages: [{ role: 'user', content: 'Say this is a test' }],
    //   model: 'gpt-3.5-turbo',
    // });
    // console.log(chatCompletion);

    return result;
  } catch (error) {
    throw error;
  }
};
exports.testProductReviews = async (url) => {
  try {
    // const productsData = "html"

    if (!url) {
      url = `https://lyfefuel.com/products/essentials-nutrition-shake`;
    }

    const htmlContent = await scrapeHTML(url);
    const $ = cheerio.load(htmlContent);

   

    



    //get html block for reviews 
    // const response =  await gemini_prompt(`only return html block for only review from this : ${cleanedBody}`)
    //  const re = await gemini_prompt(`only return css selector for  reviewList , reviewContent ,reviewAuthor in json FORMAT like 
    //   {
    //   reviewList:<css selector for container element that wrapped all reviews>,
    //   reviewContent:<css selector for text content or body of each review element >,
    //   reviewAuthor:<css selector for author name  of each review element >,
         
    // reviewContent:<text value  for content or body of each review element >,
    // reviewAuthor:<text value for author name  of each review element >,
    //   }
      // from this : ${cleanedBody}`)
     const selectors = await gemini_prompt(`find all reviews in the page return in json array of object each object will be each review FORMAT like 
      {

      reviewList:<css selector for container or list  element that wrapped all reviews elements .>,
      
      reviewContentCssSelector:<css selector for text content or body of each review element >,
 
      reviewAuthorCssSelector:<css selector for author name  of each review element >,
     }
      from this : ${htmlContent} response should only be in JSON format array of object .`)

      const re = await gemini_prompt(`
        find all reviews from inside of css selector = ${selectors.reviewList} and give me response in this format 
        [
        {
        reviewContent:<text value  for content or body of each review element >,
        reviewAuthor:<text value for author name  of each review element >,
        reviewRating:<text value for review rating  of each review element >,
        },....
        ]

        from this : ${htmlContent} response should only be in JSON format array of object .
        `)
    return JSON.parse(re);
  } catch (error) {
    throw error;
  }
};





//new - servie
exports.NewScrapeForProductReviews = async(url)=>{
  
  const data = await fetchHTML(url)
  return data
}
