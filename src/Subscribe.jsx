import { useState } from "react";

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalisedEmail = email.trim().toLowerCase();

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(normalisedEmail)) {
      setStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/.netlify/functions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalisedEmail }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not subscribe. Please try again.");
      }

      setStatus({ type: "success", message: data.message || "Thanks for subscribing!" });
      setEmail("");
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not reach the subscription service.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="subscribe-bar">
      <div className="subscribe-content">
        <h3>SIGN UP FOR OUR DAILY INSIDER</h3>
        <form className="subscribe-input-group" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            aria-label="Email address for newsletter"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
        {status && <p role="status" className={`subscribe-message subscribe-${status.type}`}>{status.message}</p>}
      </div>
    </section>
  );
}
