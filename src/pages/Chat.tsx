import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebase-config";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  PaperAirplaneIcon,
  PlusIcon,
  ChevronDownIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import ConfirmModal from "../components/ConfirmModal";

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
  const [selectedChats, setSelectedChats] = useState([]);
  const [showSelect, setShowSelect] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadChats = async () => {
      const chatsRef = collection(db, "users", user.uid, "chats");
      const q = query(chatsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const chats = snapshot.docs.map((doc) => ({
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        provider: doc.data().provider || "OpenAI",
      }));
      setChatList(chats);
      if (chats.length > 0) {
        setChatId(chats[0].id);
        await loadMessages(chats[0].id);
        setProvider(chats[0].provider);
      } else {
        await createNewChat(provider);
      }
    };

    loadChats();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (chatId) => {
    const messagesRef = collection(db, "users", user.uid, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));
    const snapshot = await getDocs(q);
    const msgs = snapshot.docs.map((doc) => doc.data());
    setMessages(msgs);
  };

  const createNewChat = async (chosenProvider = provider) => {
    const newChatRef = await addDoc(collection(db, "users", user.uid, "chats"), {
      createdAt: serverTimestamp(),
      provider: chosenProvider,
    });
    setChatId(newChatRef.id);
    setProvider(chosenProvider);
    setMessages([]);
    setChatList((prev) => [
      { id: newChatRef.id, createdAt: new Date(), provider: chosenProvider },
      ...prev,
    ]);
  };

  const addMessage = async (chatId, sender, content) => {
    const messageRef = collection(db, "users", user.uid, "chats", chatId, "messages");
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

    try {
      let aiResponse = "";

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
        aiResponse = data.choices?.[0]?.message?.content || "Er ging iets mis met OpenAI.";

      } else if (provider === "Gemini") {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: input }] }],
            }),
          }
        );

        const data = await response.json();
        aiResponse =
          data.candidates?.[0]?.content?.parts?.[0]?.text || "Er ging iets mis met Gemini.";
      }

      setMessages((prev) => [...prev, { sender: "ai", content: aiResponse }]);
      await addMessage(chatId, "ai", aiResponse);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "ai", content: "Er is een fout opgetreden bij het ophalen van het AI-antwoord." }]);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleSelectToggle = () => {
    setShowSelect(!showSelect);
    setSelectedChats([]);
  };

  const toggleChatSelection = (id) => {
    setSelectedChats((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const deleteSelectedChats = async () => {
    for (const id of selectedChats) {
      await deleteDoc(doc(db, "users", user.uid, "chats", id));
    }
    setChatList(chatList.filter((chat) => !selectedChats.includes(chat.id)));
    setMessages([]);
    setChatId(null);
    setSelectedChats([]);
    setShowSelect(false);
    setShowModal(true);
  };

  const handleProviderSwitch = async (newProvider) => {
    setDropdownOpen(false);
    await createNewChat(newProvider);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md rounded-r-2xl flex flex-col z-10">
        <div className="p-4 border-b border-gray-200 flex flex-col items-center">
          <img src="/impact-iq-logo.png" alt="Impact IQ Logo" className="h-8 mb-2" />
          <img src="/impact-iq-mascot.png" alt="Mascot" className="w-12 drop-shadow-xl" />
        </div>

        {/* Provider Dropdown */}
        <div className="px-4 pt-2 pb-4 relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full bg-impactTurquoise text-white font-semibold rounded-lg py-2 px-4 flex justify-between items-center"
          >
            {provider}
            <ChevronDownIcon className="h-4 w-4 ml-2" />
          </button>
          {dropdownOpen && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white border rounded-lg shadow z-50">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  className="w-full text-left px-4 py-2 hover:bg-impactTurquoise hover:text-white transition text-impactTurquoise"
                  onClick={() => handleProviderSwitch(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {chatList.map((chat) => (
            <div key={chat.id} className="flex items-center gap-2">
              {showSelect && (
                <input
                  type="checkbox"
                  checked={selectedChats.includes(chat.id)}
                  onChange={() => toggleChatSelection(chat.id)}
                />
              )}
              <button
                onClick={() => {
                  setChatId(chat.id);
                  loadMessages(chat.id);
                  setProvider(chat.provider || "OpenAI");
                }}
                className={`flex-1 text-left px-4 py-2 rounded-lg border ${
                  chat.id === chatId
                    ? "bg-impactTurquoise text-white"
                    : "bg-white text-impactTurquoise hover:bg-impactTurquoise/10"
                }`}
              >
                [{chat.provider}]{" "}
                {chat.createdAt?.toLocaleString("nl-BE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </button>
            </div>
          ))}
        </div>

        {chatList.length > 0 && (
          <div className="px-4 my-2 flex flex-col gap-2">
            <button
              onClick={handleSelectToggle}
              className="w-full border border-impactTurquoise text-impactTurquoise rounded-lg py-2 font-semibold hover:bg-impactTurquoise hover:text-white transition"
            >
              {showSelect ? "Annuleer" : "Selecteer"}
            </button>
            {showSelect && selectedChats.length > 0 && (
              <button
                onClick={deleteSelectedChats}
                className="w-full bg-red-500 text-white font-semibold rounded-lg py-2 flex items-center justify-center gap-2"
              >
                <TrashIcon className="w-5 h-5" />
                Verwijder
              </button>
            )}
          </div>
        )}

        <div className="px-4 my-4">
          <button
            onClick={() => createNewChat(provider)}
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

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="px-6 pt-6 text-xs text-gray-500">
          Chat met: <span className="font-semibold">{provider}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`px-4 py-2 my-1 rounded-xl shadow max-w-md ${
                msg.sender === "user"
                  ? "bg-impactTurquoise text-white self-end ml-auto"
                  : "bg-white text-gray-800 self-start mr-auto"
              }`}
            >
              <div className="whitespace-pre-wrap">
  {msg.content.split("```").map((block, i) =>
    i % 2 === 1 ? (
      <pre key={i} className="bg-gray-100 text-sm p-3 rounded-md overflow-auto text-black font-mono mb-2">
        {block.trim()}
      </pre>
    ) : (
      <span key={i}>{block}</span>
    )
  )}
</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

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
      <ConfirmModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
 
