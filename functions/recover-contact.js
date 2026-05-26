const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { name, email, linkedin, message, source } = JSON.parse(event.body);

    // Validate required fields
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email is required" }),
      };
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from("recover_contacts")
      .insert([
        {
          name: name || null,
          email,
          linkedin: linkedin || null,
          message: message || null,
          source: source || "website",
          submitted_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error("Supabase error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to save contact" }),
      };
    }

    // Redirect or response based on form submission
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Contact saved. Redirecting to booking...",
        redirect: "https://calendly.com/barneslam",
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
