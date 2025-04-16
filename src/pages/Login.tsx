import { useState } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../firebase-config";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/chat");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/chat");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-3xl p-8 md:p-12 grid md:grid-cols-2 gap-6 items-center">
        
        {/* Logo + Mascot */}
        <div className="flex flex-col items-center text-center space-y-4">
          <img src="/impact-iq-logo.png" alt="Impact IQ Logo" className="w-40" />
          <img src="/impact-iq-mascot.png" alt="Mascot" className="w-28 drop-shadow-xl hidden md:block" />
          <p className="text-sm text-gray-600 mt-2">Empowering professionals with smart, actionable intelligence</p>
        </div>

        {/* Form Card */}
        <div className="w-full space-y-6">
          <h2 className="text-3xl font-extrabold text-gray-800 text-center tracking-wide">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <button
              type="submit"
              className="w-full bg-teal-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-teal-600 transition duration-300 ease-in-out shadow"
            >
              {isRegister ? "Register" : "Sign In"}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm text-gray-500 bg-white px-2">
              Or continue with
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center py-2 rounded-md transition shadow"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 mr-3"
            />
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </button>

          <p className="text-center text-sm text-gray-600">
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="font-semibold text-teal-600 hover:text-teal-500"
            >
              {isRegister ? "Sign In" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
