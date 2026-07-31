const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(
    path.join(
        __dirname,
        "mesa-facil-serviceAccount.json"
    )
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
}, "mesa");

module.exports = admin.app("mesa").firestore();