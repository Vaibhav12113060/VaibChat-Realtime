import { useState } from "react";
import { registerUser } from "../services/authService";

const Register = () => {
  const [form, setForm] = useState({
    userName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await registerUser(form);

      console.log("REGISTER RESPONSE:", res.data);

      alert("Registration Successful ✅");

      window.location.href = "/";
    } catch (error) {
      console.log(error);
      alert("Registration Failed ❌");
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-black text-white">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded w-80">
        <h2 className="text-xl mb-4">Register</h2>

        <input
          type="text"
          name="userName"
          placeholder="Username"
          className="w-full mb-3 p-2 bg-gray-800"
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full mb-3 p-2 bg-gray-800"
          onChange={handleChange}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
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

        <button className="w-full bg-green-500 p-2 mb-3">Register</button>

        {/* 🔥 LOGIN LINK */}
        <p className="text-sm text-center">
          Already have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
