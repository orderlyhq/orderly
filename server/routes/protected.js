const express = require("express");

const auth = require("../middleware/auth");
const tenant = require("../middleware/tenant");

const router = express.Router();

router.use(auth);

router.use(tenant);

router.get("/me", (req, res) => {
  res.json({
    success: true,

    uid: req.user.uid,

    empresaId: req.empresaId,

    usuario: req.usuario,
  });
});

module.exports = router;