const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(__dirname));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL =
  process.env.GEMINI_MODEL || "gemini-3.8-flash";


/* =========================================
   GEMINI AI HELPER WITH AUTOMATIC RETRY
========================================= */

async function askAI(prompt) {

  if (!ai) {
    throw new Error(
      "GEMINI_API_KEY is not set."
    );
  }

  const maxAttempts = 3;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {

    try {

      const result =
        await ai.models.generateContent({
          model: MODEL,
          contents: prompt
        });

      return result.text || "";

    } catch (error) {

      const message =
        error?.message || "";

      console.error(
        `Gemini attempt ${attempt} failed:`,
        message
      );

      const temporaryError =
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("429") ||
        message.includes("RESOURCE_EXHAUSTED");

      /*
        API key / coding errors ko retry nahi karna.
        Sirf temporary server/quota errors retry honge.
      */

      if (
        !temporaryError ||
        attempt === maxAttempts
      ) {
        throw error;
      }

      const waitTime =
        attempt * 3000;

      console.log(
        `Retrying Gemini in ${waitTime / 1000} seconds...`
      );

      await new Promise(
        resolve =>
          setTimeout(resolve, waitTime)
      );
    }
  }
}


/* =========================================
   SAFE JSON PARSER
========================================= */

function parseJSON(text) {

  const cleaned =
    text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

  return JSON.parse(cleaned);
}


/* =========================================
   1. GENERATE AI QUESTION
========================================= */

app.post(
  "/api/generate-question",
  async (req, res) => {

    try {

      const {
        subject,
        topic
      } = req.body || {};


      if (
        typeof subject !== "string" ||
        typeof topic !== "string" ||
        !subject.trim() ||
        !topic.trim()
      ) {

        return res.status(400).json({
          error:
            "Please enter both subject and topic."
        });

      }


      const prompt = `
You are a friendly educational tutor.

Generate ONE clear, age-appropriate educational question.

IMPORTANT:
- Write the question in ENGLISH ONLY.
- Do NOT use Hindi.
- Do NOT use Hinglish.
- Do NOT include the answer.
- Keep the question simple and clear.

Subject:
${subject.trim().slice(0, 100)}

Topic:
${topic.trim().slice(0, 200)}

Return ONLY valid JSON in exactly this format:

{"question":"Your question here"}
`;


      const data =
        parseJSON(
          await askAI(prompt)
        );


      if (
        typeof data.question !== "string" ||
        !data.question.trim()
      ) {

        throw new Error(
          "Invalid question response."
        );

      }


      res.json({
        question:
          data.question.trim()
      });


    } catch (error) {

      console.error(
        "Question generation error:",
        error.message
      );


      res.status(500).json({
        error:
          "Question generation failed. Please try again."
      });

    }

  }
);


/* =========================================
   2. CHECK STUDENT ANSWER
========================================= */

app.post(
  "/api/check-answer",
  async (req, res) => {

    try {

      const {
        question,
        studentAnswer
      } = req.body || {};


      if (
        typeof question !== "string" ||
        typeof studentAnswer !== "string" ||
        !question.trim() ||
        !studentAnswer.trim()
      ) {

        return res.status(400).json({
          error:
            "Question and answer are required."
        });

      }


      const prompt = `
You are a fair, encouraging educational tutor.

Evaluate the student's answer.

Question:
${question.trim().slice(0, 2000)}

Student answer:
${studentAnswer.trim().slice(0, 5000)}

Evaluation rules:

1. Accept correct ideas even if the wording is different.
2. Set correct=true only when the answer is substantially correct.
3. Explain clearly why the answer is correct or incorrect.
4. Give one useful suggestion for improvement.
5. Provide a concise model/improved answer.

IMPORTANT LANGUAGE RULES:

- Respond in ENGLISH ONLY.
- Do NOT use Hindi.
- Do NOT use Hinglish.
- Keep the language simple and student-friendly.
- Every JSON value must be in English.

Return ONLY valid JSON using exactly this schema:

{
  "correct": true,
  "feedback": "Explain whether the answer is correct and why.",
  "suggestion": "Give a useful improvement suggestion.",
  "improvedAnswer": "Give a concise model answer."
}
`;


      const data =
        parseJSON(
          await askAI(prompt)
        );


      res.json({

        correct:
          data.correct === true,

        feedback:
          String(
            data.feedback ||
            "Your answer has been evaluated."
          ),

        suggestion:
          String(
            data.suggestion || ""
          ),

        improvedAnswer:
          String(
            data.improvedAnswer || ""
          )

      });


    } catch (error) {

      console.error(
        "Answer checking error:",
        error.message
      );


      res.status(500).json({
        error:
          "AI answer checking failed. Please try again."
      });

    }

  }
);


/* =========================================
   3. ADAPTIVE LEARNING
========================================= */

app.post(
  "/api/adaptive-feedback",
  async (req, res) => {

    try {

      const {
        subject,
        topic,
        mood,
        question,
        studentAnswer,
        correct
      } = req.body || {};


      if (
        typeof subject !== "string" ||
        typeof topic !== "string" ||
        typeof question !== "string" ||
        typeof studentAnswer !== "string" ||
        typeof correct !== "boolean"
      ) {

        return res.status(400).json({
          error:
            "Invalid learning information."
        });

      }


      const prompt = `
You are an adaptive educational tutor.

Your job is to decide what the student should do NEXT based on:

- their mood
- their topic
- their question
- their answer
- whether their answer was correct

Student information:

Subject:
${subject.trim().slice(0, 100)}

Topic:
${topic.trim().slice(0, 200)}

Mood:
${String(
  mood || "not specified"
).slice(0, 50)}

Question:
${question.trim().slice(0, 2000)}

Student answer:
${studentAnswer.trim().slice(0, 5000)}

Answer correctness:
${correct ? "Correct" : "Incorrect"}

ADAPTIVE RULES:

1. If the answer is CORRECT:
   Recommend a slightly harder challenge,
   deeper application, or another concept.

2. If the answer is INCORRECT:
   Recommend a simpler explanation,
   concept revision, or an easier practice question.

3. If mood is "bored":
   Make the next activity interactive,
   practical, or challenging.

4. If mood is "confused":
   Focus on a simple explanation
   and strengthen the foundation.

5. If mood is "low-energy":
   Keep the next activity short,
   simple, and easy to start.

6. If mood is "curious":
   Suggest an interesting real-world
   connection or deeper concept.

7. If mood is "challenge":
   Suggest a harder problem
   or advanced application.

IMPORTANT LANGUAGE RULES:

- Respond in ENGLISH ONLY.
- Do NOT use Hindi.
- Do NOT use Hinglish.
- Keep the recommendation concise.
- Make it student-friendly.

Return ONLY valid JSON in exactly this format:

{
  "nextStep": "Short title for the next learning step",
  "reason": "Explain briefly why this step was selected",
  "activity": "Describe what the student should do next"
}
`;


      const data =
        parseJSON(
          await askAI(prompt)
        );


      res.json({

        nextStep:
          String(
            data.nextStep ||
            "Continue learning"
          ),

        reason:
          String(
            data.reason ||
            "This activity matches your current progress."
          ),

        activity:
          String(
            data.activity ||
            "Continue practising the topic."
          )

      });


    } catch (error) {

      console.error(
        "Adaptive learning error:",
        error.message
      );


      res.status(500).json({
        error:
          "Adaptive recommendation failed. Please try again."
      });

    }

  }
);


/* =========================================
   HOME PAGE
========================================= */

app.get(
  "/",
  (_req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );

  }
);


/* =========================================
   START SERVER
========================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `StudySpark running on port ${PORT}`
    );

  }
);