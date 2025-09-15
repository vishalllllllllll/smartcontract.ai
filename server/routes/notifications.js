const express = require("express");
const { auth } = require("../middleware/auth");
const router = express.Router();
router.get("/", auth, (req, res) => res.json({ notifications: [], message: "Placeholder endpoint" }));
module.exports = router;
