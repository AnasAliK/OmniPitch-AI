require('dotenv').config();

async function run() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Omnipitch Pro",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: "hello, output in JSON: {\"reply\": \"hi\"}" }],
        response_format: { type: "json_object" }
      })
    });

    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response text:", text);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

run();
