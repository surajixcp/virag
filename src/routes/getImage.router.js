const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

router.get(
  "/download/:folder1/:folder2/:folder3/:filename",
  async (req, res) => {
    let filepath = "";
    let defaultfilepath = "";
    
    filepath = `${path.join(__dirname, "../../") + req.params.folder1}/${req.params.folder2}/${req.params.folder3}/${req.params.filename}`;

    defaultfilepath = `${path.join(
      __dirname,
      "/../static/uploads"
    )}/no-img.png`;

    if (fs.existsSync(filepath)) {
      return res.status(200).sendFile(filepath);
    }
    return res.status(400).sendFile(defaultfilepath);
  }
);

module.exports = router;
