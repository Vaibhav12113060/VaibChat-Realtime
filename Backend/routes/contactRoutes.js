const express = require("express");

const {
  createContactControllers,
  ContactListSavedController,
  searchContactController,
  deleteContactController,
  updateContactController,
} = require("../controllers/contactControllers");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply Middleware
router.use(authMiddleware);

//Routes
router.post("/createContact/:id", createContactControllers);

router.get("/contactList/:id", ContactListSavedController);

// search contacts
router.get("/:id/search", searchContactController);

// delete contacts

router.delete("/:id/deleteContact", deleteContactController);

// Update Contact

router.put("/:id/updateContact", updateContactController);
module.exports = router;
