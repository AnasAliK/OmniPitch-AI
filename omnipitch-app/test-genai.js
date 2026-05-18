require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModel(modelName) {
  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: "hello"
    });
    console.log(`Success with ${modelName}`);
  } catch (e) {
    console.log(`Error with ${modelName}: ${e.message}`);
  }
}

async function run() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-2.5-flash');
  await testModel('gemini-pro');
}

run();
