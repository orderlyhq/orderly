const router = require("express").Router();

router.use(
  "/protected",
  require("./protected"),
);

module.exports = router;