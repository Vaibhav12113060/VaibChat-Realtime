import API from "./api";

// Saari chats lana (Saved + Unknown)
export const getAllConversations = () => API.get("/conver");

// Conversation create ya fetch karna
export const getOrCreateConversation = (targetId) =>
  API.post(`/conver/create/${JSON.parse(localStorage.getItem("user"))._id}`, {
    participants: [targetId],
    type: "direct",
  });
