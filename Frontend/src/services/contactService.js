import API from "./api";

// get all contacts
export const getContacts = (userId) =>
  API.get(`/contact/contactList/${userId}`);

// create contact
export const createContact = (userId, data) =>
  API.post(`/contact/createContact/${userId}`, data);

// delete contact
export const deleteContact = (userId, contact_id) =>
  API.delete(`/contact/${userId}/deleteContact`, {
    data: { contact_id },
  });

// update nickname
export const updateContact = (userId, data) =>
  API.put(`/contact/${userId}/updateContact`, data);

// search contact
export const searchContact = (userId, query) =>
  API.get(`/contact/${userId}/search?query=${query}`);
