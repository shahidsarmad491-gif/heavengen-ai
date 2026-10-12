
export default async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "POST requests only" },
      { status: 405 }
    );
  }

  const token = process.env.HF_TOKEN;

  if (!token) {
    return Response.json(
      { error: "HF_TOKEN is not configured" },
      { status: 500 }
    );
  }

  try {
    const { prompt = "" } = await req.json();

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      prompt.length > 800
    ) {
      return Response.json(
        { error: "Enter a prompt under 800 characters" },
        { status: 400 }
      );
    }

    const result = await fetch(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt.trim() })
      }
    );

    if (!result.ok) {
      return Response.json(
        { error: "AI provider error", status: result.status },
        { status: 502 }
      );
    }

    const type = result.headers.get("content-type") || "";

    if (!type.startsWith("image/")) {
      return Response.json(
        { error: "Provider did not return an image" },
        { status: 502 }
      );
    }

    const bytes = new Uint8Array(await result.arrayBuffer());
    let binary = "";

    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return Response.json({
      image: `data:${type};base64,${btoa(binary)}`
    });
  } catch {
    return Response.json(
      { error: "Request failed. Please try again." },
      { status: 500 }
    );
  }
};
      
