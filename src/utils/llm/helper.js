const { GoogleGenerativeAI } = require("@google/generative-ai");
const gemini_prompt = async (prompt) => {
  // Make sure to include these imports:
  const apiKey = "AIzaSyBbP26G_2TA5vH3AmHeOZDTK7X89qPlTxs"||process.env.GEMINI_API_KEY
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" ,generationConfig:{
    responseMimeType:"application/json"
  } })

  //   prompt = "Write a story about a magic backpack.";

  var result = await model.generateContent(prompt);
  result = result.response.text();
  result = result.replace("```json", "").replace("```", "");
  //   console.log(result.response.text());
  return result
};
module.exports = { gemini_prompt };
