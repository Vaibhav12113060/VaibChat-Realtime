const Sidebar = () => {
  return (
    <div className="h-full bg-[#0B0F19] p-4">
      <h1 className="text-xl font-semibold mb-4">VaibChat</h1>

      <input
        placeholder="Search..."
        className="w-full p-2 mb-4 rounded bg-[#111827] outline-none"
      />

      <div className="space-y-2">
        <div className="p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-700">
          John
        </div>

        <div className="p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-700">
          Alex
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
