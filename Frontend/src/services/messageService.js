import API from "./api";

// Kisi specific conversation ke saare messages lana
export const getMessages = (conversationId) => {
  return API.get(`/message/${conversationId}`);
};

// Message bhejna
export const sendMessage = (data) => {
  return API.post("/message/send", data);
};
