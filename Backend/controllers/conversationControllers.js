const conversationModel = require("../models/conversationModel");
const mongoose = require("mongoose");
const userModel = require("../models/userModel");

///   CREATE CONVERSATION

const createChatController = async (req, res) => {
  try {
    const senderId = req.params.id;
    let { type = "direct", participants = [], groupName } = req.body;

    // Validate participants
    if (!Array.isArray(participants)) {
      return res.status(400).send({
        success: false,
        message: "Participants must be an array",
      });
    }

    //////////////////////////////////////////
    // Normalize + Add Sender
    //////////////////////////////////////////
    participants = [...new Set([...participants, senderId])]
      .map((id) => id.toString())
      .sort();

    //////////////////////////////////////////
    // Validate Users Exist
    //////////////////////////////////////////
    const userCount = await userModel.countDocuments({
      _id: { $in: participants },
    });

    if (userCount !== participants.length) {
      return res.status(404).send({
        success: false,
        message: "One or more participants do not exist",
      });
    }

    //////////////////////////////////////////
    // DIRECT CHAT
    //////////////////////////////////////////
    let conversationKey;

    if (type === "direct") {
      if (participants.length !== 2) {
        return res.status(400).send({
          success: false,
          message: "Direct chat must contain exactly 2 users",
        });
      }

      // Create deterministic unique key for direct chat
      conversationKey = participants.join("_");

      const existing = await conversationModel.findOne({ conversationKey });

      if (existing) {
        return res.status(200).send({
          success: true,
          message: "Conversation already exists",
          data: existing,
        });
      }
    }

    //////////////////////////////////////////
    // BUILD ROLE-BASED PARTICIPANTS
    //////////////////////////////////////////
    let participantObjects;

    if (type === "direct") {
      // Direct chats: all members
      participantObjects = participants.map((id) => ({
        userId: id,
        role: "member",
      }));
    } else {
      // Group chats: sender is owner, others are members
      participantObjects = participants.map((id) => ({
        userId: id,
        role: id === senderId.toString() ? "owner" : "member",
      }));
    }

    //////////////////////////////////////////
    // GROUP VALIDATION
    //////////////////////////////////////////
    if (type === "group") {
      if (participants.length < 3) {
        return res.status(400).send({
          success: false,
          message: "Group must have at least 3 members",
        });
      }

      if (!groupName?.trim()) {
        return res.status(400).send({
          success: false,
          message: "Group name is required",
        });
      }
    }

    //////////////////////////////////////////
    // CREATE CONVERSATION
    //////////////////////////////////////////
    const conversation = await conversationModel.create({
      type,
      participants: participantObjects,
      conversationKey: type === "direct" ? conversationKey : undefined,
      groupName: type === "group" ? groupName : undefined,
      groupDescription: type === "group" ? "" : undefined,
      groupProfile: type === "group" ? "" : undefined,
      lastMessageAt: new Date(),
    });

    res.status(201).send({
      success: true,
      message: "Conversation created successfully",
      data: conversation,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Create Conversation API",
      error: error.message,
    });
  }
};

// Add Contact inside a existing group

const addContactIntoGroupController = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { requesterId, targetUserId } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid conversation ID" });
    }
    if (
      !mongoose.Types.ObjectId.isValid(requesterId) ||
      !mongoose.Types.ObjectId.isValid(targetUserId)
    ) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid user ID" });
    }

    // Fetch conversation
    const conversation = await conversationModel.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      return res
        .status(404)
        .send({ success: false, message: "Group not found" });
    }

    // Check requester permissions (owner or admin)
    const requester = conversation.participants.find(
      (p) => p.userId.toString() === requesterId,
    );
    if (!requester || !["owner", "admin"].includes(requester.role)) {
      return res.status(403).send({
        success: false,
        message: "Only owner or admin can add members",
      });
    }

    // Prevent duplicate
    const alreadyMember = conversation.participants.some(
      (p) => p.userId.toString() === targetUserId,
    );
    if (alreadyMember) {
      return res
        .status(400)
        .send({ success: false, message: "User already in group" });
    }

    // Add new member
    conversation.participants.push({
      userId: targetUserId,
      role: "member",
      archived: false,
      deleted: false,
    });

    await conversation.save();

    res.status(200).send({
      success: true,
      message: "Member added successfully",
      data: conversation,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Add Contact Into Group API",
      error: error.message,
    });
  }
};

// Get All Conversations

const getAllConversationController = async (req, res) => {
  try {
    const userId = req.user._id;

    const getAllConver = await conversationModel
      .find({
        participants: {
          $elemMatch: {
            userId: userId,
            deleted: false,
          },
        },
      })
      .sort({ lastMessageAt: -1 }); // Sort by recent message

    if (getAllConver.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Conversation Found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "Successfully fetched all Conversations",
      data: getAllConver,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in Get ALL Conversation API",
      error: error.message,
    });
  }
};

// Get Conversation By ID

const getConversationByIDController = async (req, res) => {
  try {
    const conversationId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid Conversation ID",
      });
    }

    const conversation = await conversationModel.findById(conversationId);

    // Check if conversation exists
    if (!conversation) {
      return res.status(404).send({
        success: false,
        message: "Conversation not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Conversation fetched successfully",
      data: conversation,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get Conversation By ID API",
      error: error.message,
    });
  }
};

//  Update Group Info

const updateGroupInfoController = async (req, res) => {
  try {
    const { conversationId } = req.params;
    // const userId = req.user._id;

    const { userId, groupName, groupDescription, groupProfile } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await conversationModel.findById(conversationId);

    if (!conversation || conversation.type !== "group") {
      return res.status(404).send({
        success: false,
        message: "Group not found",
      });
    }

    const userParticipant = conversation.participants.find(
      (p) => p.userId.toString() === userId.toString(),
    );

    if (!userParticipant) {
      return res.status(403).send({
        success: false,
        message: "You are not a member of this group",
      });
    }

    if (!["owner", "admin"].includes(userParticipant.role)) {
      return res.status(403).send({
        success: false,
        message: "Only owner or admin can update group info",
      });
    }

    // Update only provided fields
    if (groupName !== undefined) conversation.groupName = groupName;
    if (groupDescription !== undefined)
      conversation.groupDescription = groupDescription;
    if (groupProfile !== undefined) conversation.groupProfile = groupProfile;

    await conversation.save();

    res.status(200).send({
      success: true,
      message: "Group information updated successfully",
      conversation,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error updating group info",
      error: error.message,
    });
  }
};

// Delete Conversation

const deleteChatController = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await conversationModel.findById(conversationId);

    if (!conversation) {
      return res.status(404).send({
        success: false,
        message: "Conversation not found",
      });
    }

    // Find requester in participants
    const requester = conversation.participants.find(
      (p) => p.userId.toString() === userId.toString(),
    );

    if (!requester) {
      return res.status(403).send({
        success: false,
        message: "You are not part of this conversation",
      });
    }

    ////////////////////////////////////////
    // GROUP CHAT DELETE (OWNER ONLY)
    ////////////////////////////////////////

    if (conversation.type === "group") {
      if (requester.role !== "owner") {
        return res.status(403).send({
          success: false,
          message: "Only group creator can delete this group",
        });
      }

      // Owner deletes → HARD DELETE group
      await conversationModel.findByIdAndDelete(conversationId);

      return res.status(200).send({
        success: true,
        message: "Group deleted successfully",
      });
    }

    ////////////////////////////////////////
    // DIRECT CHAT DELETE (DELETE FOR ME)
    ////////////////////////////////////////

    if (conversation.type === "direct") {
      requester.deleted = true;
      await conversation.save();

      return res.status(200).send({
        success: true,
        message: "Conversation deleted for you",
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Conversation API",
      error: error.message,
    });
  }
};

const softDeleteConversationController = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    // Atomic soft delete (best practice)
    const conversation = await conversationModel.findOneAndUpdate(
      {
        _id: conversationId,
        participants: {
          $elemMatch: {
            userId: userId,
            deleted: false,
          },
        },
      },
      {
        $set: {
          "participants.$.deleted": true,
        },
      },
      { new: true },
    );

    if (!conversation) {
      return res.status(404).send({
        success: false,
        message:
          "Conversation not found, already deleted, or user not a participant",
      });
    }

    res.status(200).send({
      success: true,
      message: "Conversation deleted for you",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in soft delete conversation API",
      error: error.message,
    });
  }
};

const removeContactFromGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIdToRemove } = req.body;
    const requesterId = req.user._id.toString();

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userIdToRemove)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID provided",
      });
    }

    const group = await conversationModel.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Get Participants
    const requester = group.participants.find(
      (p) => p.userId.toString() === requesterId,
    );
    const isOwner = requester?.role === "owner";
    const isAdmin = requester?.role === "admin";

    // Check requester role
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to remove participants",
      });
    }

    // Check target user
    const targetUser = group.participants.find(
      (p) => p.userId.toString() === userIdToRemove.toString(),
    );

    if (!targetUser) {
      return res.status(400).json({
        success: false,
        message: "User is not a participant of this group",
      });
    }

    // Logic: Admin cannot remove owner or other admins
    if (
      !isOwner &&
      (targetUser.role === "owner" || targetUser.role === "admin")
    ) {
      return res.status(403).json({
        success: false,
        message: "Admins cannot remove other admins or the owner",
      });
    }

    // Remove from participants
    group.participants = group.participants.filter(
      (p) => p.userId.toString() !== userIdToRemove.toString(),
    );

    await group.save();

    return res.status(200).json({
      success: true,
      message: "Participant removed successfully",
    });
  } catch (error) {
    console.error("Remove Contact Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const makeAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIdToPromote } = req.body;
    const requesterId = req.user._id.toString();

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userIdToPromote)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID provided",
      });
    }

    const group = await conversationModel.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // ✅ Only owner allowed to make admins
    const requester = group.participants.find(
      (p) => p.userId.toString() === requesterId,
    );

    if (!requester || requester.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only group owner can assign admin rights",
      });
    }

    // Find target user
    const targetUser = group.participants.find(
      (p) => p.userId.toString() === userIdToPromote.toString(),
    );

    if (!targetUser) {
      return res.status(400).json({
        success: false,
        message: "User must be a participant to become admin",
      });
    }

    if (targetUser.role === "admin" || targetUser.role === "owner") {
      return res.status(400).json({
        success: false,
        message: "User is already an admin",
      });
    }

    // Update role
    targetUser.role = "admin";

    await group.save();

    return res.status(200).json({
      success: true,
      message: "User promoted to admin successfully",
    });
  } catch (error) {
    console.error("Make Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const removeAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminIdToRemove } = req.body;
    const requesterId = req.user._id.toString();

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(adminIdToRemove)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID provided",
      });
    }

    const group = await conversationModel.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // ✅ Only owner allowed to remove admins
    const requester = group.participants.find(
      (p) => p.userId.toString() === requesterId,
    );

    if (!requester || requester.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only group owner can remove admins",
      });
    }

    // Find target
    const targetUser = group.participants.find(
      (p) => p.userId.toString() === adminIdToRemove.toString(),
    );

    if (!targetUser || targetUser.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "User is not an admin",
      });
    }

    // Downgrade to member
    targetUser.role = "member";

    await group.save();

    return res.status(200).json({
      success: true,
      message: "Admin removed successfully",
    });
  } catch (error) {
    console.error("Remove Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const transferOwnershipController = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { newOwnerId } = req.body;
    const requesterId = req.user._id.toString();

    ///////////////////////////////////////

    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(newOwnerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const group = await conversationModel.findById(groupId); // Correct model usage

    if (!group || group.type !== "group") {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    ///////////////////////////////////////
    // Only owner allowed
    ///////////////////////////////////////

    const requester = group.participants.find(
      (p) => p.userId.toString() === requesterId,
    );

    if (!requester || requester.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only owner can transfer ownership",
      });
    }

    const newOwner = group.participants.find(
      (p) => p.userId.toString() === newOwnerId.toString(),
    );

    if (!newOwner) {
      return res.status(400).json({
        success: false,
        message: "New owner must be a group member",
      });
    }

    // Swap roles
    requester.role = "admin"; // Old owner becomes admin
    newOwner.role = "owner"; // New user becomes owner

    await group.save();

    return res.status(200).json({
      success: true,
      message: "Ownership transferred successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in transfer ownership",
      error: error.message,
    });
  }
};

const leaveGroupController = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { actionType, newOwnerId } = req.body;
    const userId = req.user._id.toString();

    //////////////////////////////////////////

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }

    const group = await conversationModel.findById(groupId);

    if (!group || group.type !== "group") {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    //////////////////////////////////////////
    // Check membership
    //////////////////////////////////////////

    const participant = group.participants.find(
      (p) => p.userId.toString() === userId,
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this group",
      });
    }

    const isOwner = participant.role === "owner";

    /////////////////////////////////////////////////////////////
    // ⭐ OWNER FLOW
    /////////////////////////////////////////////////////////////

    if (isOwner) {
      // OWNER must choose
      if (!actionType) {
        return res.status(400).json({
          success: false,
          message:
            "Owner must either DELETE the group or TRANSFER ownership before leaving",
        });
      }

      ////////////////////////////////////////
      // DELETE GROUP
      ////////////////////////////////////////

      if (actionType === "DELETE") {
        await conversationModel.findByIdAndDelete(groupId);

        return res.status(200).json({
          success: true,
          message: "Group deleted successfully",
        });
      }

      ////////////////////////////////////////
      // TRANSFER OWNERSHIP
      ////////////////////////////////////////

      if (actionType === "TRANSFER") {
        if (!newOwnerId) {
          return res.status(400).json({
            success: false,
            message: "New owner ID required",
          });
        }

        const newOwner = group.participants.find(
          (p) => p.userId.toString() === newOwnerId.toString(),
        );

        if (!newOwner) {
          return res.status(400).json({
            success: false,
            message: "New owner must be a group participant",
          });
        }

        // Assign new owner role
        newOwner.role = "owner";

        // Remove old owner from participants
        group.participants = group.participants.filter(
          (p) => p.userId.toString() !== userId,
        );

        await group.save();

        return res.status(200).json({
          success: true,
          message: "Ownership transferred and you left the group",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid actionType. Use DELETE or TRANSFER",
      });
    }

    /////////////////////////////////////////////////////////////
    // ⭐ ADMIN / MEMBER FLOW
    /////////////////////////////////////////////////////////////

    // Remove self from participants
    group.participants = group.participants.filter(
      (p) => p.userId.toString() !== userId,
    );

    await group.save();

    /////////////////////////////////////////////////////////////
    // TODO → Emit system message
    /////////////////////////////////////////////////////////////
    // Example:
    // socket.emit("system-message", `${req.user.name} left the group`);

    return res.status(200).json({
      success: true,
      message: "You have left the group",
    });
  } catch (error) {
    console.error("Leave Group Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
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
};
