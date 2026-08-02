const admin = require("../config/firebase");

async function auth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token não informado.",
      });
    }

    const token = authorization.replace("Bearer ", "");

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null,
      token: decodedToken,
    };

    next();
  } catch (error) {
    console.error("[AUTH]", error);

    return res.status(401).json({
      success: false,
      message: "Token inválido.",
    });
  }
}

module.exports = auth;