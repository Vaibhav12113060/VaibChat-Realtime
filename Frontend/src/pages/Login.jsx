import { useState } from "react";
import { loginUser } from "../services/authService";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await loginUser(form);

      console.log("LOGIN RESPONSE:", res.data);

      // ✅ STORE DATA
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.location.href = "/chat";
    } catch (error) {
      console.log(error);
      alert("Login Failed");
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-black text-white">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded w-80">
        <h2 className="text-xl mb-4">Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full mb-3 p-2 bg-gray-800"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full mb-3 p-2 bg-gray-800"
          onChange={handleChange}
        />

        <button className="w-full bg-blue-500 p-2 mb-3">Login</button>

        {/* 🔥 REGISTER LINK */}
        <p className="text-sm text-center">
          Don't have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => (window.location.href = "/register")}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
