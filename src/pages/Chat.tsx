import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebase-config";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  PaperAirplaneIcon,
  PlusIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

const PROVIDERS = ["OpenAI", "Gemini"];

export default function Chat() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [provider, setProvider] = useState("OpenAI");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chatList, setChatList] = useState([]);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadChats = async () => {
      const chatsRef = collection(db, "users", user.uid, "chats");
      const q = query(chatsRef, orderBy("createdAt", "desc"));
      const chatSnapshot = await getDocs(q);
      const chats = chatSnapshot.docs.map((doc) => ({
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
      }));
      setChatList(chats);

      if (chats.length > 0) {
        setChatId(chats[0].id);
        await loadMessages(chats[0].id);
      } else {
        await createNewChat();
      }
    };

    loadChats();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (chatId) => {
    const messagesRef = collection(
      db,
      "users",
      user.uid,
      "chats",
      chatId,
      "messages"
    );
    const q = query(messagesRef, orderBy("timestamp"));
    const querySnapshot = await getDocs(q);
    const msgs = querySnapshot.docs.map((doc) => doc.data());
    setMessages(msgs);
  };

  const createNewChat = async () => {
    const newChatRef = await addDoc(collection(db, "users", user.uid, "chats"), {
      createdAt: serverTimestamp(),
    });
    setChatId(newChatRef.id);
    setMessages([]);
    setChatList((prev) => [
      { id: newChatRef.id, createdAt: new Date() },
      ...prev,
    ]);
  };

  const addMessage = async (chatId, sender, content) => {
    const messageRef = collection(
      db,
      "users",
      user.uid,
      "chats",
      chatId,
      "messages"
    );
    await addDoc(messageRef, {
      sender,
      content,
      timestamp: serverTimestamp(),
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || !chatId) return;

    const userMessage = { sender: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    await addMessage(chatId, "user", input);
    setInput("");

    let aiResponse = "";

    try {
      if (provider === "OpenAI") {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: input }],
          }),
        });
        const data = await response.json();
        aiResponse = data.choices[0].message.content;
      } else if (provider === "Gemini") {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: input }],
                },
              ],
            }),
          }
        );
        const data = await response.json();
        aiResponse = data.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      aiResponse = "Er is een fout opgetreden bij het ophalen van het AI-antwoord.";
    }

    setMessages((prev) => [...prev, { sender: "ai", content: aiResponse }]);
    await addMessage(chatId, "ai", aiResponse);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md rounded-r-2xl flex flex-col z-10">
        <div className="p-4 border-b border-gray-200 flex flex-col items-center">
          <img src="/impact-iq-logo.png" alt="Impact IQ Logo" className="h-8 mb-2" />
          <img src="/impact-iq-mascot.png" alt="Mascot" className="w-12 drop-shadow-xl" />
        </div>

        <div className="px-4 pt-2 pb-4 relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full bg-impactTurquoise text-white font-semibold rounded-lg py-2 px-4 flex justify-between items-center"
          >
            {provider}
            <ChevronDownIcon className="h-4 w-4 ml-2" />
          </button>
          {dropdownOpen && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white border rounded-lg shadow z-50 text-black">
                            {PROVIDERS.map((p) => (
                <button
                  key={p}
                  className="w-full text-left px-4 py-2 hover:bg-impactTurquoise hover:text-white transition"
                  onClick={() => {
                    setProvider(p);
                    setDropdownOpen(false);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {chatList.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                setChatId(chat.id);
                loadMessages(chat.id);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg border ${
                chat.id === chatId
                  ? "bg-impactTurquoise text-white"
                  : "bg-white text-impactTurquoise hover:bg-impactTurquoise/10"
              }`}
            >
              {chat.createdAt?.toLocaleString("nl-BE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          ))}
        </div>

        <div className="px-4 my-4">
          <button
            onClick={createNewChat}
            className="w-full bg-white text-impactTurquoise border border-impactTurquoise rounded-lg py-2 px-4 font-semibold hover:bg-impactTurquoise hover:text-white transition duration-300 ease-in-out flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Chat
          </button>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full bg-white text-red-500 border border-red-500 rounded-lg py-2 px-4 font-semibold hover:bg-red-500 hover:text-white transition duration-300 ease-in-out"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2 my-1 rounded-xl shadow max-w-md ${
                  msg.sender === "user"
                    ? "bg-impactTurquoise text-white"
                    : "bg-white text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t flex items-center gap-2">
          <div className="w-full flex bg-gray-50 rounded-xl border shadow-inner px-4 py-2">
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-black"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
              className="bg-white text-impactTurquoise p-2 rounded-lg hover:bg-impactTurquoise hover:text-white transition duration-300 ease-in-out"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
