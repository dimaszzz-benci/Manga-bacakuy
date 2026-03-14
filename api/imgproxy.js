export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("No URL");
  try {
    const response = await fetch(decodeURIComponent(url));
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(buffer));
  } catch {
    res.status(500).send("Error");
  }
}
