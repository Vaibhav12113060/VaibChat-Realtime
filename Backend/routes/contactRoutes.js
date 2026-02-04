const express = require("express");

const {
  createContactControllers,
  ContactListSavedController,
  searchContactController,
  deleteContactController,
  updateContactController,
} = require("../controllers/contactControllers");
const router = express.Router();

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
