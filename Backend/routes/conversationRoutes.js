const express = require("express");

const {
  createChatController,
  addContactIntoGroupController,
  getAllConversationController,
  getConversationByIDController,
  deleteChatController,
  removeContactFromGroup,
  makeAdmin,
  removeAdmin,
  transferOwnershipController,
  leaveGroupController,
  updateGroupInfoController,
  softDeleteConversationController,
} = require("../controllers/conversationControllers");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply Middleware to all conversation routes
router.use(authMiddleware);

//////////////////////////////////////////////////////
// Conversation Routes
//////////////////////////////////////////////////////

// Create conversation (direct or group)
router.post("/create/:id", createChatController);

// Get all conversations of logged-in user
router.get("/", getAllConversationController);

// Get single conversation
router.get("/:id", getConversationByIDController);

// Hard delete (ONLY OWNER should be allowed inside controller)
router.delete("/:id", deleteChatController);

// Soft delete (hide chat for user)
router.patch("/soft-delete/:conversationId", softDeleteConversationController);

//////////////////////////////////////////////////////
// Group Management Routes
//////////////////////////////////////////////////////

// Add participants to group
router.patch(
  "/group/add-participants/:conversationId",
  addContactIntoGroupController,
);

// Remove participant (admin/owner)
router.patch(
  "/group/remove-participant/:conversationId",
  removeContactFromGroup,
);

// Make admin (OWNER only)
router.patch("/group/make-admin/:conversationId", makeAdmin);

// Remove admin (OWNER only)
router.patch("/group/remove-admin/:conversationId", removeAdmin);

// Transfer ownership
router.patch(
  "/group/transfer-ownership/:conversationId",
  transferOwnershipController,
);

// Leave group (member/admin/owner logic inside controller)
router.patch("/group/leave/:conversationId", leaveGroupController);

// Update group info (name, description, profile pic)
router.patch("/group/update/:conversationId", updateGroupInfoController);

module.exports = router;
