export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Método não permitido.",
    });
  }

  return res.status(200).json({
    success: true,
    service: "orderly-api",
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
  });
}