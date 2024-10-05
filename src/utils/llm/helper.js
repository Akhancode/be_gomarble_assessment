const { GoogleGenerativeAI } = require("@google/generative-ai");
const { default: OpenAI } = require("openai");
const gemini_prompt = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY
  // Make sure to include these imports:
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" ,generationConfig:{
    responseMimeType:"application/json"
  } })


  var result = await model.generateContent(prompt);
  result = result.response.text();
  result = result.replace("```json", "").replace("```", "");
  //   console.log(result.response.text());
  return result
};
const openAi_prompt = async (prompt) => {
  const openAI_api_key = process.env.OPENAI_API_KEY
    const openai = new OpenAI({
      apiKey:openAI_api_key
    });
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
      response_format:{type:"json_object"}
      
    });


  result = response.choices[0].message.content
  console.log("result" ,result)
  // result = result.replace("```json", "").replace("```", "");
  //   console.log(result.response.text());
  return result
};
module.exports = { gemini_prompt ,openAi_prompt};
