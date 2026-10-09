document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("studyForm");
  const moodButtons = [...document.querySelectorAll(".mood-option")];
  const timeButtons = [...document.querySelectorAll(".time-option")];
  const message = document.getElementById("formMessage");
  const planContent = document.getElementById("planContent");
  const emptyState = document.getElementById("emptyState");
  const sessionsCompleted = document.getElementById("sessionsCompleted");
  let selectedMood = "curious";
  let selectedTime = 15;

  moodButtons.forEach(button => {
    button.addEventListener("click", () => {
      moodButtons.forEach(b => b.classList.remove("selected"));
      button.classList.add("selected");
      selectedMood = button.dataset.mood;
    });
  });
  const defaultMood = moodButtons.find(b => b.dataset.mood === selectedMood);
  if (defaultMood) defaultMood.classList.add("selected");

  timeButtons.forEach(button => {
    button.addEventListener("click", () => {
      timeButtons.forEach(b => b.classList.remove("selected"));
      button.classList.add("selected");
      selectedTime = Number(button.dataset.time);
    });
  });

  function updateCompleted() {
    const checked = planContent.querySelectorAll(".activity input:checked").length;
    sessionsCompleted.textContent = String(checked);
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const subject = document.getElementById("subject").value.trim();
    const topic = document.getElementById("topic").value.trim();
    const count = Math.max(1, Math.min(6, Number(document.getElementById("topicCount").value) || 3));
    if (!subject || !topic) {
      message.textContent = "Please enter a subject and topic.";
      return;
    }

    const activities = makePlan(subject, topic, selectedMood, selectedTime, count);
    planContent.replaceChildren();
    const intro = document.createElement("p");
    intro.textContent = `${selectedTime}-minute plan for ${topic} · ${subject} · Mood: ${selectedMood.replace("-", " ")}`;
    planContent.appendChild(intro);

    const list = document.createElement("div");
    list.className = "activity-list";
    activities.forEach((activity, index) => {
      const item = document.createElement("label");
      item.className = "activity";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.addEventListener("change", updateCompleted);
      const content = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = `${index + 1}. ${activity.title}`;
      const desc = document.createElement("p");
      desc.textContent = activity.description;
      content.append(title, desc);
      item.append(checkbox, content);
      list.appendChild(item);
    });
    planContent.appendChild(list);
    planContent.hidden = false;
    emptyState.hidden = true;
    sessionsCompleted.textContent = "0";
    message.textContent = "Your study plan is ready!";
  });

  function makePlan(subject, topic, mood, totalMinutes, count) {
    const templates = [
      ["Quick preview", `Spend ${Math.max(2, Math.round(totalMinutes * .15))} minutes listing what you already know about ${topic}.`],
      ["Learn the core idea", `Study the main concepts of ${topic} in ${subject}. Write 3 key points in your own words.`],
      ["Make an example", `Create one real-life example or a small diagram explaining ${topic}.`],
      ["Active recall", `Close your notes and explain ${topic} aloud without looking.`],
      ["Practice", `Answer two practice questions about ${topic}; mark anything uncertain.`],
      ["Review and reflect", `Summarize what you learned and write one question to revisit.`]
    ];
    if (mood === "low-energy") templates[0] = ["Gentle start", `Take a calm 2-minute start: read the heading and one short section about ${topic}.`];
    if (mood === "bored") templates[2] = ["Make it visual", `Turn ${topic} into a mini mind map, sketch, or colourful set of notes.`];
    if (mood === "confused") templates[1] = ["Break it down", `Split ${topic} into small parts. Define unfamiliar words before moving on.`];
    if (mood === "challenge") templates[4] = ["Challenge round", `Try explaining ${topic} from memory, then solve a harder practice problem.`];
    if (mood === "curious") templates[2] = ["Explore why", `Find a connection between ${topic} and something you see in everyday life.`];
    return templates.slice(0, count).map(([title, description]) => ({title, description}));
  }
});
