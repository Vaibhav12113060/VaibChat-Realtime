const MessageInput = () => {
  return (
    <div className="p-4 border-t border-gray-800 flex gap-2 bg-[#0B0F19]">
      <input
        className="flex-1 p-2 bg-[#111827] rounded outline-none"
        placeholder="Type a message..."
      />
      <button className="bg-blue-600 px-4 rounded">Send</button>
    </div>
  );
};

export default MessageInput;
