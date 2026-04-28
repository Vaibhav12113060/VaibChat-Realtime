const ChatBubble = ({ text, isOwn }) => {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-4 py-2 rounded-lg max-w-xs ${
          isOwn ? "bg-blue-600" : "bg-gray-700"
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatBubble;
