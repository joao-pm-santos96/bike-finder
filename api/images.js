const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const query = (req.query?.query || "motorcycle").toString().trim();

  if (!PEXELS_API_KEY) {
    return res.status(200).json({ photos: [], fallback: true, reason: "missing_pexels_api_key" });
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_API_KEY
        }
      }
    );

    if (!response.ok) {
      return res.status(200).json({ photos: [], fallback: true, reason: "image_api_error" });
    }

    const data = await response.json();
    const first = (data.photos || [])[0];
    if (first?.src?.large || first?.src?.medium) {
      return res.json({
        photos: [
          {
            id: first.id,
            alt: first.alt || "Moto",
            src: first.src?.large || first.src?.medium || "",
            photographer: first.photographer || "",
            photographerUrl: first.photographer_url || ""
          }
        ],
        fallback: false,
        reason: "ok"
      });
    }

    return res.json({
      photos: [],
      fallback: true,
      reason: "no_valid_motorcycle_images"
    });
  } catch (_error) {
    return res.status(200).json({ photos: [], fallback: true, reason: "image_api_unreachable" });
  }
};
