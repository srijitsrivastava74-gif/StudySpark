document.addEventListener("DOMContentLoaded", () => {

  const generateBtn =
    document.getElementById("generateQuestionBtn");

  const checkBtn =
    document.getElementById("checkAnswerBtn");

  const questionBox =
    document.getElementById("generatedQuestion");

  const answerBox =
    document.getElementById("studentAnswer");

  const statusBox =
    document.getElementById("answerStatus");

  const feedbackBox =
    document.getElementById("aiFeedback");

  let currentQuestion = "";


  // ================================
  // GENERATE AI QUESTION
  // ================================

  generateBtn.addEventListener("click", async () => {

    const subject =
      document.getElementById("subject").value.trim();

    const topic =
      document.getElementById("topic").value.trim();

    if (!subject || !topic) {

      statusBox.textContent =
        "Please enter both subject and topic above.";

      return;
    }

    generateBtn.disabled = true;

    statusBox.textContent =
      "Generating your AI question...";

    feedbackBox.replaceChildren();

    try {

      const response = await fetch(
        "/api/generate-question",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            subject,
            topic
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          "Failed to generate the question."
        );
      }

      currentQuestion =
        data.question;

      questionBox.textContent =
        currentQuestion;

      answerBox.value = "";

      statusBox.textContent =
        "Question ready! Write your answer below.";

    } catch (error) {

      statusBox.textContent =
        error.message ||
        "Unable to connect to the server.";

    } finally {

      generateBtn.disabled = false;
    }

  });


  // ================================
  // CHECK STUDENT ANSWER
  // ================================

  checkBtn.addEventListener("click", async () => {

    if (!currentQuestion) {

      statusBox.textContent =
        "Please generate an AI question first.";

      return;
    }

    const studentAnswer =
      answerBox.value.trim();

    if (!studentAnswer) {

      statusBox.textContent =
        "Please write your answer first.";

      return;
    }

    const subject =
      document.getElementById("subject")
        .value
        .trim();

    const topic =
      document.getElementById("topic")
        .value
        .trim();

    const selectedMood =
      document.querySelector(
        ".mood-option.selected"
      );

    const mood =
      selectedMood
        ? selectedMood.dataset.mood
        : "curious";


    checkBtn.disabled = true;

    statusBox.textContent =
      "AI is checking your answer...";

    feedbackBox.replaceChildren();


    try {

      // =================================
      // STEP 1 — CHECK ANSWER
      // =================================

      const response =
        await fetch(
          "/api/check-answer",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              question: currentQuestion,
              studentAnswer
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          "Failed to check the answer."
        );
      }


      // =================================
      // FEEDBACK CARD
      // =================================

      const card =
        document.createElement("div");

      card.className =
        "feedback-card";


      const heading =
        document.createElement("h3");

      heading.className =
        data.correct
          ? "correct"
          : "incorrect";


      heading.textContent =
        data.correct
          ? "✅ Correct!"
          : "📝 Needs improvement";


      card.appendChild(heading);


      addParagraph(
        card,
        data.feedback
      );


      if (data.suggestion) {

        addParagraph(
          card,
          "💡 Suggestion: " +
          data.suggestion
        );
      }


      if (data.improvedAnswer) {

        addParagraph(
          card,
          "📘 Improved answer: " +
          data.improvedAnswer
        );
      }


      feedbackBox.appendChild(card);


      // =================================
      // STEP 2 — ADAPTIVE LEARNING
      // =================================

      statusBox.textContent =
        "Personalizing your next learning step...";


      const adaptiveResponse =
        await fetch(
          "/api/adaptive-feedback",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({

              subject,
              topic,
              mood,
              question: currentQuestion,
              studentAnswer,
              correct: data.correct

            })
          }
        );


      const adaptiveData =
        await adaptiveResponse.json();


      if (!adaptiveResponse.ok) {

        throw new Error(
          adaptiveData.error ||
          "Adaptive recommendation failed."
        );
      }


      // =================================
      // ADAPTIVE CARD
      // =================================

      const adaptiveCard =
        document.createElement("div");

      adaptiveCard.className =
        "feedback-card adaptive-card";


      const adaptiveHeading =
        document.createElement("h3");

      adaptiveHeading.textContent =
        "🧠 Your next learning step";


      adaptiveCard.appendChild(
        adaptiveHeading
      );


      // Next step title

      addParagraph(
        adaptiveCard,
        "🎯 " +
        adaptiveData.nextStep
      );


      // Why AI selected it

      addParagraph(
        adaptiveCard,
        "Why: " +
        adaptiveData.reason
      );


      // Activity

      addParagraph(
        adaptiveCard,
        "Next activity: " +
        adaptiveData.activity
      );


      // =================================
      // START CHALLENGE BUTTON
      // =================================

      const challengeBtn =
        document.createElement("button");

      challengeBtn.type = "button";

      challengeBtn.className =
        "primary full";

      challengeBtn.textContent =
        "🚀 Start Challenge";


      challengeBtn.addEventListener(
        "click",
        () => {

          startChallenge(
            subject,
            topic,
            adaptiveData
          );

        }
      );


      adaptiveCard.appendChild(
        challengeBtn
      );


      feedbackBox.appendChild(
        adaptiveCard
      );


      statusBox.textContent =
        "Your personalized learning path is ready!";


    } catch (error) {

      statusBox.textContent =
        error.message ||
        "Something went wrong while processing your answer.";

    } finally {

      checkBtn.disabled = false;
    }

  });


  // ================================
  // START ADAPTIVE CHALLENGE
  // ================================

  function startChallenge(
    subject,
    topic,
    adaptiveData
  ) {

    questionBox.textContent =
      "🚀 " +
      adaptiveData.nextStep +
      "\n\n" +
      adaptiveData.activity;


    answerBox.value = "";

    feedbackBox.replaceChildren();


    statusBox.textContent =
      "Your adaptive challenge is ready. Think carefully and submit your answer!";


    answerBox.focus();


    // Change button text temporarily

    generateBtn.textContent =
      "🎯 Generate another question";

  }


  // ================================
  // ADD PARAGRAPH
  // ================================

  function addParagraph(
    parent,
    text
  ) {

    const p =
      document.createElement("p");

    p.textContent =
      text || "";

    parent.appendChild(p);
  }

});