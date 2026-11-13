// Replace this example address with the Cloudflare Worker URL from your class.
const WORKER_URL = "https://loreal-chatbot.your-subdomain.workers.dev/";
const SYSTEM_PROMPT =
  "You are a helpful L’Oréal beauty advisor. Answer only questions about L’Oréal products, beauty routines, recommendations, and related beauty topics. If a question is unrelated, politely decline and invite the user to ask about L’Oréal or beauty. Be clear, considerate, and never invent product details.";

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendBtn");
const chatWindow = document.getElementById("chatWindow");

// Keep the full conversation so follow-up questions have context.
const conversation = [{ role: "system", content: SYSTEM_PROMPT }];

function addMessage(role, content, extraClass = "") {
  const message = document.createElement("article");
  message.className = `message ${role} ${extraClass}`.trim();

  const label = document.createElement("p");
  label.className = "message-label";
  label.textContent = role === "user" ? "You" : "L’Oréal Beauty Advisor";

  const text = document.createElement("div");
  text.className = "message-content";
  text.textContent = content;

  message.append(label, text);
  chatWindow.append(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return message;
}

// Welcome the user before they send their first question.
addMessage(
  "assistant",
  "Hello! I’m your L’Oréal beauty advisor. Tell me what you’re looking for, your skin or hair goals, or the products you already love. You can also share your name so I can personalize our conversation.",
);

// Shrink the logo header gently after the user scrolls.
function updateHeaderSize() {
  document
    .getElementById("siteHeader")
    .classList.toggle("is-compact", window.scrollY > 40);
}

window.addEventListener("scroll", updateHeaderSize, { passive: true });
updateHeaderSize();

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = userInput.value.trim();
  if (!question) {
    return;
  }

  // Show the latest question immediately, directly above its reply.
  addMessage("user", question);
  conversation.push({ role: "user", content: question });
  userInput.value = "";
  userInput.disabled = true;
  sendButton.disabled = true;
  const pendingMessage = addMessage(
    "assistant",
    "Finding a helpful answer…",
    "pending",
  );

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation }),
    });

    if (!response.ok) {
      throw new Error(`The beauty advisor request failed (${response.status}).`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("The beauty advisor returned an empty or invalid reply.");
    }

    pendingMessage.remove();
    addMessage("assistant", reply.trim());
    conversation.push({ role: "assistant", content: reply.trim() });
  } catch (error) {
    console.error("Could not get a beauty advisor response:", error);
    pendingMessage.remove();
    addMessage(
      "assistant",
      "Sorry, I couldn’t get a response just now. Please try again in a moment.",
    );
  } finally {
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
});
