import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadMessages() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error loading messages", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !message) return;

    try {
      await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, message }),
      });
      setMessage("");
      await loadMessages();
    } catch (err) {
      console.error("Error sending message", err);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Fullstack Messages Demo</h1>
      <p>Backend: <code>{API_BASE}</code></p>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: 8, width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ padding: 8, width: "100%" }}
          />
        </div>
        <button type="submit" style={{ padding: "8px 16px", cursor: "pointer" }}>
          Send
        </button>
      </form>

      {loading ? (
        <p>Loading messages...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {messages.map((m) => (
            <li
              key={m.id}
              style={{
                padding: 12,
                marginBottom: 8,
                border: "1px solid #ddd",
                borderRadius: 6,
              }}
            >
              <strong>{m.username}:</strong> {m.message}
              <div style={{ fontSize: 12, color: "#555" }}>
                {m.created_at}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
