const admin = require("../config/firebase");

async function tenant(req, res, next) {
  try {
    const uid = req.user.uid;

    const usuarioRef = admin.firestore().collection("usuarios").doc(uid);

    const usuarioSnap = await usuarioRef.get();

    if (!usuarioSnap.exists) {
      return res.status(403).json({
        success: false,
        message: "Usuário não pertence a nenhuma empresa.",
      });
    }

    const usuario = usuarioSnap.data();

    if (!usuario?.empresaId) {
      return res.status(403).json({
        success: false,
        message: "Usuário sem empresa associada.",
      });
    }

    req.empresaId = usuario.empresaId;

    req.usuario = {
      id: usuarioSnap.id,
      ...usuario,
    };

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
