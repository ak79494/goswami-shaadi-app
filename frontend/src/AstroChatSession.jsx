import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAstrologer } from "./AstroChat";
import api from "./api";

export default function AstroChatSession() {
  const nav = useNavigate();
  const { id } = useParams();
  const astro = getAstrologer(id);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  const [messages, setMessages] = useState([
    {
      from: "astro",
      text: `Namaste 🙏 I am ${astro.name}. Please share your question and your birth date, time and place for a detailed reading.`
    }
  ]);

  const send = async () => {
    const message = text.trim();

    if (!message || sending) return;

    setSending(true);
    setStatus("");

    try {
      await api.post("/astro/whatsapp/message", {
        astrologerId: astro.id,
        message
      });

      setMessages((prev) => [
        ...prev,
        {
          from: "user",
          text: message,
          sent: true
        }
      ]);

      setText("");
      setStatus("✓ Message sent to astrologer");
    } catch (error) {
      const serverMessage = error?.response?.data?.message;

      setStatus(
        serverMessage ||
        "Message could not be sent. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="astro-session-page">

      <header className="astro-session-header">

        <button
          type="button"
          onClick={() => nav("/astro-chat")}
        >
          ‹
        </button>

        <img
          src={astro.image}
          alt={astro.name}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <div>
          <h1>{astro.name}</h1>
          <span>
            ● Online • ₹{astro.price}/min
          </span>
        </div>

        <button
          type="button"
          className="astro-session-call"
          onClick={() =>
            setStatus(
              "Call masking requires a telephony provider."
            )
          }
        >
          ☎
        </button>

      </header>

      <div className="astro-session-notice">
        🔒 Private consultation • Your Goswami Jodi account is charged per minute.
      </div>

      <main className="astro-message-list">

        {messages.map((message, index) => (

          <div
            key={index}
            className={`astro-bubble ${message.from}`}
          >
            {message.text}

            {message.sent && (
              <small className="astro-message-status">
                ✓ Sent
              </small>
            )}

          </div>

        ))}

      </main>

      {status && (
        <div
          className={`astro-send-status ${
            status.startsWith("✓")
              ? "success"
              : "error"
          }`}
        >
          {status}
        </div>
      )}

      <div className="astro-quick-row">

        {[
          "Marriage kab hoga?",
          "Kundli check karna hai",
          "Career guidance",
          "Love life"
        ].map((q) => (

          <button
            type="button"
            key={q}
            onClick={() => {
              setText(q);
              setStatus("");
            }}
          >
            {q}
          </button>

        ))}

      </div>

      <footer className="astro-composer">

        <input
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          placeholder="Type your message…"
          disabled={sending}
          onKeyDown={(e) => {

            if (
              e.key === "Enter" &&
              !e.shiftKey
            ) {
              e.preventDefault();
              send();
            }

          }}
        />

        <button
          type="button"
          onClick={send}
          disabled={
            sending ||
            !text.trim()
          }
        >
          {sending ? "…" : "➤"}
        </button>

      </footer>

    </div>
  );
}