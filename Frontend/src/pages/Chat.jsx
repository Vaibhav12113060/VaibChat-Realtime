import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import {
  getContacts,
  deleteContact,
  createContact,
} from "../services/contactService";
import { getMessages, sendMessage } from "../services/messageService";
import { formatTime } from "../utils/formatTime";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const ENDPOINT = import.meta.env.VITE_BACKEND_URL;
let socket;

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [tab, setTab] = useState("chats");

  // UI Control States
  const [activeMenu, setActiveMenu] = useState({ type: null, id: null });
  const [isTyping, setIsTyping] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form States
  const [newContactId, setNewContactId] = useState("");
  const [nickname, setNickname] = useState("");

  const navigate = useNavigate();
  const scrollRef = useRef();
  const fileInputRef = useRef();
  const profileInputRef = useRef();
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Global click listener to close any open menus
  useEffect(() => {
    const handleGlobalClick = () => setActiveMenu({ type: null, id: null });
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  useEffect(() => {
    if (!currentUser) return navigate("/");
    socket = io(ENDPOINT, { auth: { token } });
    socket.emit("setup", currentUser);

    fetchInitialData();

    socket.on("message received", (msg) => {
      fetchInitialData();
      if (selectedChat?._id === msg.conversationId)
        setMessages((p) => [...p, msg]);
    });

    socket.on("typing", (room) => {
      if (selectedChat?._id === room) setIsTyping(true);
    });
    socket.on("stop typing", (room) => {
      if (selectedChat?._id === room) setIsTyping(false);
    });

    return () => socket.disconnect();
  }, [selectedChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      const [convRes, contactRes] = await Promise.all([
        API.get("/conver"),
        API.get(`/contact/contactList/${currentUser._id}`),
      ]);
      setConversations(convRes.data.data || []);
      setContacts(contactRes.data.contactList || []);
    } catch (err) {
      console.error("Server Link Failed", err);
    }
  };

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    try {
      const res = await getMessages(chat._id);
      setMessages(res.data.data || []);
      socket.emit("join chat", chat._id);
      await API.put("/message/read", { conversationId: chat._id });
    } catch (err) {
      console.error(err);
    }
  };

  const onSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    socket.emit("stop typing", selectedChat._id);
    try {
      const { data } = await sendMessage({
        content: newMessage,
        conversationId: selectedChat._id,
      });
      socket.emit("new message", data.data);
      setMessages((p) => [...p, data.data]);
      setNewMessage("");
      fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const uploadAndSendMedia = async () => {
    if (!mediaPreview) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", mediaPreview);
    try {
      const { data: uploadRes } = await API.post("/message/upload", formData);
      const { data: msgRes } = await sendMessage({
        conversationId: selectedChat._id,
        content: uploadRes.url,
        messageType: uploadRes.type === "image" ? "image" : "file",
      });
      socket.emit("new message", msgRes.data);
      setMessages((p) => [...p, msgRes.data]);
      setMediaPreview(null);
      fetchInitialData();
    } catch (err) {
      alert("Upload failed");
    }
    setUploading(false);
  };

  const handleDeleteMessage = async (messageId, deleteType) => {
    try {
      await API.post("/message/delete", { messageId, deleteType });
      if (deleteType === "me") {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      } else {
        fetchInitialData();
        handleSelectChat(selectedChat);
      }
    } catch (e) {
      alert("Delete failed");
    }
  };

  const getOtherUser = (chat) => {
    if (!chat) return {};
    const other = chat.participants?.find(
      (p) =>
        (p.userId?._id || p.userId).toString() !== currentUser._id.toString(),
    );
    const saved = contacts.find(
      (con) =>
        (con.contactUserId?._id || con.contactUserId).toString() ===
        (other?.userId?._id || other?.userId)?.toString(),
    );
    return {
      name:
        saved?.nickname ||
        other?.userId?.userName ||
        other?.userId?.phone ||
        "Unknown",
      id: (other?.userId?._id || other?.userId)?.toString(),
      profile: other?.userId?.profile,
      isSaved: !!saved,
      isOnline: other?.userId?.isOnline,
    };
  };

  return (
    <div className="h-screen w-full flex bg-[#111b21] text-[#e9edef] overflow-hidden fixed font-sans shadow-2xl">
      {/* SIDEBAR */}
      <div className="w-[30%] h-full border-r border-[#2f3b43] flex flex-col min-w-[350px] relative z-30">
        <div className="h-[60px] bg-[#202c33] px-4 flex justify-between items-center shrink-0">
          <div
            className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer border border-gray-500 overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileOpen(true);
            }}
          >
            {currentUser.profile ? (
              <img
                src={currentUser.profile}
                className="w-full h-full object-cover"
              />
            ) : (
              currentUser.userName[0].toUpperCase()
            )}
          </div>
          <h1 className="font-bold text-[#00a884] text-lg">VaibChat</h1>
          <div className="flex gap-2 relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="p-2 hover:bg-[#3b4a54] rounded-full text-xl font-bold"
            >
              ⊕
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(
                  activeMenu.id === "top"
                    ? { type: null, id: null }
                    : { type: "top", id: "top" },
                );
              }}
              className="p-2 hover:bg-[#3b4a54] rounded-full text-xl font-bold"
            >
              ⋮
            </button>
            {activeMenu.type === "top" && (
              <div className="absolute right-0 top-12 w-48 bg-[#233138] py-2 rounded shadow-2xl border border-[#2f3b43] z-[100]">
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="w-full text-left px-4 py-2 hover:bg-[#182229] text-sm"
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "/";
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#182229] text-sm text-red-500 font-bold border-t border-[#2f3b43]"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-[#111b21] border-b border-[#2f3b43]">
          <button
            onClick={() => setTab("chats")}
            className={`flex-1 py-3 text-[11px] font-bold tracking-widest ${tab === "chats" ? "text-[#00a884] border-b-2 border-[#00a884]" : "text-[#8696a0]"}`}
          >
            CHATS
          </button>
          <button
            onClick={() => setTab("contacts")}
            className={`flex-1 py-3 text-[11px] font-bold tracking-widest ${tab === "contacts" ? "text-[#00a884] border-b-2 border-[#00a884]" : "text-[#8696a0]"}`}
          >
            CONTACTS
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "chats"
            ? conversations.map((chat) => {
                const other = getOtherUser(chat);
                return (
                  <div
                    key={chat._id}
                    onClick={() => handleSelectChat(chat)}
                    className={`px-4 py-3 flex items-center gap-3 cursor-pointer border-b border-[#202c33] hover:bg-[#202c33] relative group ${selectedChat?._id === chat._id ? "bg-[#2a3942]" : ""}`}
                  >
                    <div className="w-12 h-12 bg-blue-900 rounded-full shrink-0 flex items-center justify-center font-bold text-lg overflow-hidden uppercase">
                      {other.profile ? (
                        <img
                          src={other.profile}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        other.name[0]
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-center mb-1">
                        <p className="truncate text-[15px] font-medium">
                          {other.name}
                        </p>
                        <p className="text-[10px] text-[#8696a0]">
                          {formatTime(chat.lastMessageAt)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-[#8696a0] truncate pr-4">
                          {chat.lastMessage?.content || "Tap to chat"}
                        </p>
                        {!other.isSaved && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewContactId(other.id);
                              setIsModalOpen(true);
                            }}
                            className="bg-green-600 text-black px-2 py-0.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition shadow-lg"
                          >
                            SAVE
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            : contacts.map((c) => (
                <div
                  key={c._id}
                  className="px-4 py-3 flex items-center justify-between border-b border-[#202c33] hover:bg-[#202c33] relative cursor-pointer"
                  onClick={() => {
                    API.post(`/conver/create/${currentUser._id}`, {
                      participants: [c.contactUserId?._id],
                    }).then((res) => {
                      handleSelectChat(res.data.data);
                      setTab("chats");
                    });
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <div className="w-11 h-11 bg-[#005c4b] rounded-full shrink-0 flex items-center justify-center font-bold uppercase overflow-hidden">
                      {c.contactUserId.profile ? (
                        <img src={c.contactUserId.profile} />
                      ) : (
                        c.nickname[0]
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-[15px] font-medium">{c.nickname}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {c.contactUserId?.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(
                        activeMenu.id === c._id
                          ? { type: null, id: null }
                          : { type: "con", id: c._id },
                      );
                    }}
                    className="p-2 text-xl font-bold"
                  >
                    ⋮
                  </button>
                  {activeMenu.type === "con" && activeMenu.id === c._id && (
                    <div className="absolute right-4 top-12 w-32 bg-[#233138] py-2 rounded shadow-2xl border border-[#2f3b43] z-[100]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete?"))
                            API.delete(
                              `/contact/${currentUser._id}/deleteContact`,
                              { data: { contact_id: c.contactUserId?._id } },
                            ).then(fetchInitialData);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#182229] text-xs text-red-500 font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#0b141a] border-l border-[#2f3b43] relative z-10">
        {selectedChat ? (
          <>
            <div className="h-[60px] bg-[#202c33] px-4 flex justify-between items-center shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center font-bold overflow-hidden uppercase">
                  {getOtherUser(selectedChat).profile ? (
                    <img
                      src={getOtherUser(selectedChat).profile}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getOtherUser(selectedChat).name[0]
                  )}
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-medium leading-none mb-1">
                    {getOtherUser(selectedChat).name}
                  </p>
                  <p className="text-[10px] text-green-500 font-medium">
                    {isTyping
                      ? "typing..."
                      : getOtherUser(selectedChat).isOnline
                        ? "online"
                        : ""}
                  </p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(
                      activeMenu.type === "chat-opt"
                        ? { type: null, id: null }
                        : { type: "chat-opt", id: selectedChat._id },
                    );
                  }}
                  className="p-2 text-xl font-bold"
                >
                  ⋮
                </button>
                {activeMenu.type === "chat-opt" && (
                  <div className="absolute right-0 top-10 w-40 bg-[#233138] py-2 rounded shadow-2xl border border-[#2f3b43] z-[100]">
                    <button
                      onClick={() => {
                        if (window.confirm("Clear chat?"))
                          API.delete(`/conver/${selectedChat._id}`).then(() => {
                            setSelectedChat(null);
                            fetchInitialData();
                          });
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#182229] text-sm text-red-500"
                    >
                      Delete Chat
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-fixed opacity-95">
              {messages
                .filter((m) => !m.deletedFor?.includes(currentUser._id))
                .map((m, i) => {
                  const isMe =
                    (m.senderId?._id || m.senderId).toString() ===
                    currentUser._id.toString();
                  return (
                    <div
                      key={i}
                      className={`flex flex-col relative group ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-2 px-3 rounded-lg text-[14px] shadow-md relative ${isMe ? "bg-[#005c4b] rounded-tr-none" : "bg-[#202c33] rounded-tl-none"}`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(
                              activeMenu.id === m._id
                                ? { type: null, id: null }
                                : { type: "msg", id: m._id },
                            );
                          }}
                          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-1 text-[10px] bg-[#233138] rounded-full shadow-lg z-20"
                        >
                          ⌄
                        </button>

                        {m.messageType === "image" ? (
                          <img
                            src={m.content}
                            className="max-w-[250px] rounded cursor-pointer"
                            onClick={() => window.open(m.content)}
                          />
                        ) : (
                          <p className="leading-relaxed text-left pr-4 whitespace-pre-wrap">
                            {m.content}
                          </p>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                          <p className="text-[9px] text-gray-300">
                            {formatTime(m.createdAt)}
                          </p>
                          {isMe && (
                            <span
                              className={`text-[11px] font-bold ${m.status === "read" ? "text-blue-400" : "text-gray-400"}`}
                            >
                              ✓✓
                            </span>
                          )}
                        </div>

                        {activeMenu.type === "msg" &&
                          activeMenu.id === m._id && (
                            <div className="absolute top-6 right-0 w-32 bg-[#233138] py-1 rounded shadow-2xl border border-[#2f3b43] z-[200]">
                              <button
                                onClick={() => handleDeleteMessage(m._id, "me")}
                                className="w-full text-left px-3 py-1.5 hover:bg-[#182229] text-[10px]"
                              >
                                Delete for me
                              </button>
                              {isMe && (
                                <button
                                  onClick={() =>
                                    handleDeleteMessage(m._id, "everyone")
                                  }
                                  className="w-full text-left px-3 py-1.5 hover:bg-[#182229] text-[10px] text-red-500"
                                >
                                  Delete for all
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              <div ref={scrollRef} />
            </div>

            <div className="h-[62px] bg-[#202c33] flex items-center px-4 gap-4 shrink-0">
              <button
                onClick={() => fileInputRef.current.click()}
                className="text-2xl text-gray-400 rotate-45 hover:text-white transition"
              >
                📎
              </button>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={(e) => setMediaPreview(e.target.files[0])}
              />
              <input
                className="flex-1 bg-[#2a3942] p-2.5 px-4 rounded-lg outline-none text-sm border-none shadow-inner"
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (!typing) {
                    setTyping(true);
                    socket.emit("typing", selectedChat._id);
                  }
                  setTimeout(() => {
                    socket.emit("stop typing", selectedChat._id);
                    setTyping(false);
                  }, 3000);
                }}
                onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
              />
              <button
                onClick={onSendMessage}
                className="bg-green-600 p-2.5 rounded-full shadow-lg active:scale-95 transition"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                  <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
                </svg>
              </button>
            </div>

            {mediaPreview && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#233138] p-4 rounded-xl shadow-2xl border border-gray-600 z-[500] w-64 text-center">
                <img
                  src={URL.createObjectURL(mediaPreview)}
                  className="max-h-40 mx-auto rounded mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setMediaPreview(null)}
                    className="flex-1 text-xs bg-gray-600 py-1.5 rounded uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={uploadAndSendMedia}
                    className="flex-1 text-xs bg-green-600 py-1.5 rounded font-bold uppercase"
                    disabled={uploading}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35]">
            <h1 className="text-4xl font-light text-gray-600 opacity-20 tracking-tighter uppercase italic">
              VAIBCHAT
            </h1>
          </div>
        )}
      </div>

      {/* PROFILE SIDEBAR */}
      {isProfileOpen && (
        <div className="absolute left-0 top-0 w-[30%] min-w-[350px] h-full bg-[#111b21] z-[400] flex flex-col border-r border-[#2f3b43] animate-in slide-in-from-left duration-200 shadow-2xl">
          <div className="h-[110px] bg-[#202c33] flex items-end p-5 text-white gap-8 border-b border-[#2f3b43]">
            <button
              onClick={() => setIsProfileOpen(false)}
              className="mb-1 text-2xl font-bold hover:text-green-500"
            >
              ←
            </button>
            <h2 className="mb-1 font-bold text-lg uppercase tracking-widest">
              Profile
            </h2>
          </div>
          <div className="flex-1 flex flex-col items-center py-10 px-8 overflow-y-auto">
            <div className="relative group mb-10 w-44 h-44 shrink-0">
              <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center text-6xl font-bold border-4 border-[#202c33] overflow-hidden shadow-2xl">
                {currentUser.profile ? (
                  <img
                    src={currentUser.profile}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser.userName[0].toUpperCase()
                )}
              </div>
              <div
                className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer font-bold text-[10px]"
                onClick={() => profileInputRef.current.click()}
              >
                <span>CHANGE</span>
                <span>PHOTO</span>
                <input
                  type="file"
                  hidden
                  ref={profileInputRef}
                  onChange={async (e) => {
                    const f = e.target.files[0];
                    if (!f) return;
                    const fd = new FormData();
                    fd.append("file", f);
                    const { data: u } = await API.post("/message/upload", fd);
                    const { data: r } = await API.put("/user/updateProfile", {
                      profile: u.url,
                    });
                    localStorage.setItem("user", JSON.stringify(r.user));
                    fetchInitialData();
                  }}
                />
              </div>
            </div>
            <div className="w-full mb-6 border-b border-[#2f3b43] pb-2 text-left">
              <label className="text-[10px] text-[#00a884] font-bold uppercase mb-1 block">
                Your Name
              </label>
              <div className="flex justify-between items-center">
                <p className="text-gray-200 font-medium">
                  {currentUser.userName}
                </p>
                <span
                  className="text-xs cursor-pointer opacity-50 hover:opacity-100"
                  onClick={() => {
                    const newName = prompt(
                      "Enter new name:",
                      currentUser.userName,
                    );
                    if (newName)
                      API.put("/user/updateProfile", {
                        userName: newName,
                      }).then((res) => {
                        localStorage.setItem(
                          "user",
                          JSON.stringify(res.data.user),
                        );
                        fetchInitialData();
                      });
                  }}
                >
                  ✎
                </span>
              </div>
            </div>
            <div className="w-full mb-6 border-b border-[#2f3b43] pb-2 text-left">
              <label className="text-[10px] text-[#00a884] font-bold uppercase mb-1 block">
                About
              </label>
              <div className="flex justify-between items-center">
                <p className="text-gray-200 truncate pr-4">
                  {currentUser.status || "VaibChatting..."}
                </p>
                <span
                  className="text-xs cursor-pointer opacity-50 hover:opacity-100"
                  onClick={() => {
                    const newStatus = prompt(
                      "Enter new about:",
                      currentUser.status,
                    );
                    if (newStatus)
                      API.put("/user/updateProfile", {
                        status: newStatus,
                      }).then((res) => {
                        localStorage.setItem(
                          "user",
                          JSON.stringify(res.data.user),
                        );
                        fetchInitialData();
                      });
                  }}
                >
                  ✎
                </span>
              </div>
            </div>
            <div className="w-full mb-12 opacity-50 border-b border-[#2f3b43] pb-2 text-left">
              <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">
                Phone Number
              </label>
              <p className="text-gray-300 font-medium">{currentUser.phone}</p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
              className="bg-red-600/10 text-red-500 font-bold py-2.5 rounded-full border border-red-600/30 hover:bg-red-600 hover:text-white transition w-full uppercase text-xs"
            >
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[500] p-4 backdrop-blur-sm">
          <div className="bg-[#233138] p-8 rounded shadow-2xl w-full max-w-sm border border-gray-600">
            <h3 className="text-[#00a884] font-bold text-xl mb-6 uppercase tracking-wider">
              New Contact
            </h3>
            <input
              className="w-full bg-[#2a3942] p-3 rounded-xl mb-4 outline-none border border-transparent focus:border-green-500 transition text-sm"
              placeholder="User ID"
              value={newContactId}
              onChange={(e) => setNewContactId(e.target.value)}
            />
            <input
              className="w-full bg-[#2a3942] p-3 rounded-xl mb-8 outline-none border border-transparent focus:border-green-500 transition text-sm"
              placeholder="Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <div className="flex justify-end gap-5">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 font-bold text-xs"
              >
                CANCEL
              </button>
              <button
                onClick={async () => {
                  await API.post(`/contact/createContact/${currentUser._id}`, {
                    contact_ID: newContactId,
                    Nick_name: nickname,
                  });
                  setIsModalOpen(false);
                  fetchInitialData();
                }}
                className="bg-[#00a884] px-8 py-2.5 rounded-xl text-black font-bold text-sm shadow-lg transition active:scale-95"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
