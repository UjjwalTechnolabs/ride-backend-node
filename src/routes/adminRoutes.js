const express = require("express");
const AdminController = require("../controllers/adminController");

const router = express.Router();

router.post("/login", AdminController.login);
router.post("/create-sub-admin", AdminController.createSubAdmin);
router.post("/assign-permissions", AdminController.assignPermissionsToRole);

module.exports = router;
