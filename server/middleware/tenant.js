const admin = require("../config/firebase");

async function tenant(req, res, next) {
  try {
    const uid = req.user.uid;

    const snapshot = await admin
      .firestore()
      .collection("usuarios")
      .where("uid", "==", uid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(403).json({
        success: false,
        message: "Usuário não pertence a nenhuma empresa.",
      });
    }

    const usuario = snapshot.docs[0].data();

    req.empresaId = usuario.empresaId;
    req.usuario = usuario;

    next();
  } catch (error) {
    console.error("[TENANT]", error);

    res.status(500).json({
      success: false,
      message: "Erro ao carregar empresa.",
    });
  }
}

module.exports = tenant;