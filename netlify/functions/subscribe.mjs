export default async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed." }), {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
    });
  }

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!email || email.length > 254 || !emailPattern.test(email)) {
      return new Response(JSON.stringify({ message: "Please enter a valid email address." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL;
    if (!apiKey || !senderEmail) {
      console.error("Newsletter email environment variables are missing.");
      return new Response(JSON.stringify({ message: "Newsletter service is not configured yet." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: senderEmail, name: "DEV@Deakin" },
        subject: "Welcome to DEV@Deakin",
        content: [{
          type: "text/plain",
          value: "Welcome to DEV@Deakin. Thank you for subscribing to our daily insider!",
        }],
      }),
    });

    if (!sendGridResponse.ok) {
      const details = await sendGridResponse.text();
      console.error("SendGrid returned an error:", sendGridResponse.status, details);
      return new Response(JSON.stringify({ message: "We could not send the welcome email. Please try again later." }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Thanks for subscribing! Check your inbox for a welcome email." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Newsletter subscription failed:", error);
    return new Response(JSON.stringify({ message: "Invalid request. Please try again." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
