const admin = require("firebase-admin");
const serviceAccount = require("../../../viraag-aff3c-firebase-adminsdk-prq81-07ab237bf6.json");


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  module.exports = admin;


