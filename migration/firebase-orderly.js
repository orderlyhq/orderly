const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(
    path.join(
        __dirname,
        "orderly-serviceAccount.json"
    )
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}, "orderly");

const db = admin.app("orderly").firestore();

db.settings({
    ignoreUndefinedProperties: true
});

module.exports = db;