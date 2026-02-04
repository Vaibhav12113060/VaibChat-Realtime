const contactModel = require("../models/contactModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");

// CREATE CONTACT

const createContactControllers = async (req, res) => {
  try {
    const ownerId = req.params.id;
    const { contact_ID, Nick_name } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid Owner ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(contact_ID)) {
      return res.status(400).send({
        success: false,
        message: "Invalid Contact ID",
      });
    }

    // Prevent self-add
    if (ownerId === contact_ID) {
      return res.status(409).send({
        success: false,
        message: "Owner cannot add himself as a contact",
      });
    }

    // existing contact
    const existContact = await userModel.findById(contact_ID);

    if (!existContact) {
      return res.status(404).send({
        success: false,
        message: "This contact doesn't exist",
      });
    }

    // Directly create (let UNIQUE index handle duplicates)
    const contact = await contactModel.create({
      ownerUserId: ownerId,
      contactUserId: contact_ID,
      nickname: Nick_name,
    });

    return res.status(201).send({
      success: true,
      message: "Successfully saved the contact",
      contact,
    });
  } catch (error) {
    // Duplicate contact error
    if (error.code === 11000) {
      return res.status(409).send({
        success: false,
        message: "Contact already exists",
      });
    }

    return res.status(500).send({
      success: false,
      message: "Error in Create Contact API",
      error: error.message,
    });
  }
};

// GET ALL CONTACTS

const ContactListSavedController = async (req, res) => {
  try {
    const ownerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid User ID",
      });
    }

    const contactList = await contactModel
      .find({ ownerUserId: ownerId })
      .populate("contactUserId", "name email phone");
    // returns only these fields

    if (contactList.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No contacts found",
        contactList: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "Successfully fetched contacts",
      count: contactList.length,
      contactList,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in Contact List API",
      error: error.message,
    });
  }
};

// SEARCH CONTACT

const searchContactController = async (req, res) => {
  try {
    const ownerId = req.params.id;
    const { query } = req.query; // ?query=rahul

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid Owner ID",
      });
    }

    if (!query) {
      return res.status(400).send({
        success: false,
        message: "Search query is required",
      });
    }

    const results = await contactModel
      .find({
        ownerUserId: ownerId,
        $or: [{ nickname: { $regex: query, $options: "i" } }],
      })
      .populate("contactUserId", "name email phone");

    return res.status(200).send({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in Search Controller API",
      error: error.message,
    });
  }
};

// delete Contact

const deleteContactController = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).send({
        success: false,
        message: "User ID Invalid",
      });
    }
    const { contact_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(contact_id)) {
      return res.status(404).send({
        success: false,
        message: "User ID Invalid",
      });
    }

    const deletedContact = await contactModel.findOneAndDelete({
      ownerUserId: req.params.id,
      _id: contact_id,
    });

    if (!deletedContact) {
      return res.status(404).send({
        success: false,
        message: "Contact not found",
      });
    }

    res.status(200).send({
      success: true,
      message: `Successfully Deleted the Contact ID: ${contact_id} from Contact List of Owner ID: ${req.params.id} !!!!`,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in Delete Contact controllers",
      error: error.message,
    });
  }
};

// update contact nickname

const updateContactController = async (req, res) => {
  try {
    const ownerId = req.params.id;
    const { contact_id, nickname } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid Owner ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(contact_id)) {
      return res.status(400).send({
        success: false,
        message: "Invalid Contact ID",
      });
    }

    if (!nickname || nickname.trim() === "") {
      return res.status(400).send({
        success: false,
        message: "Nickname is required",
      });
    }

    const updatedContact = await contactModel.findOneAndUpdate(
      {
        ownerUserId: ownerId,
        contactUserId: contact_id,
      },
      {
        nickname: nickname.trim(),
      },
      {
        new: true,
      },
    );

    if (!updatedContact) {
      return res.status(404).send({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Contact nickname updated successfully",
      updatedContact,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in Update Contact API",
      error: error.message,
    });
  }
};

module.exports = {
  createContactControllers,
  ContactListSavedController,
  searchContactController,
  deleteContactController,
  updateContactController,
};
