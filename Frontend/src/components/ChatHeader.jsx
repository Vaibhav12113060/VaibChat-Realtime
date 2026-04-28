const ChatHeader = () => {
  return (
    <div className="p-4 border-b border-gray-800 flex justify-between bg-[#0B0F19]">
      <div>
        <p className="font-semibold">John Doe</p>
        <p className="text-xs text-green-400">Online</p>
      </div>

      <div className="cursor-pointer">⋮</div>
    </div>
  );
};

export default ChatHeader;
