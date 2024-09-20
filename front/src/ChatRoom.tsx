import React, { useEffect, useState } from 'react';
import { IoMdSend } from "react-icons/io";
import { IoAdd, IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
}

interface Participant {
  id: string;
  user: string;
  avatar: string;
}

const serverUrl = process.env.NODE_ENV === 'production'
  ? 'https://seu-servidor-em-produção.com'
  : 'http://localhost:3000';

const ChatRoom: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loggedUser, setLoggedUser] = useState<string>(localStorage.getItem('username') || 'Anonymous');
  const [avatar, setAvatar] = useState<string>(localStorage.getItem('avatar') || '👤');
  const [dark, setDark] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<string>('default-room');
  const [id] = useState<string>(localStorage.getItem('uid') || uuidv4());
  const [showParticipants, setShowParticipants] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newChatName, setNewChatName] = useState<string>('');

  useEffect(() => {
    const darkMode = localStorage.getItem('dark') === 'dark';
    setDark(darkMode);
    const chatElement = document.getElementById('main-chat');
    if (chatElement) {
      chatElement.classList.toggle('dark', darkMode);
    }

    const queryRoom = new URLSearchParams(window.location.search).get('room');
    const roomName = queryRoom || 'default-room';
    setRoom(roomName);

    document.title = `Chat - ${roomName} | Chat Anywhere`;

    setLoggedUser(localStorage.getItem('username') || 'Anonymous');
    setAvatar(localStorage.getItem('avatar') || '👤');

    const newSocket = io(serverUrl, {
      path: '/api/socket',
      query: {
        room: roomName,
        user: loggedUser,
        avatar: avatar,
        id: id,
      },
    });
    setSocket(newSocket);

    newSocket.on('message', (msg: Message) => {
      setMessages((prevMessages) => [...prevMessages, { ...msg }]);
    });

    newSocket.on('participants', (participantsList: Participant[]) => {
      setParticipants(participantsList);
    });

    return () => {
      newSocket.close();
      document.title = 'Chat Anywhere';
    };
  }, [avatar, loggedUser, room, id]);

  function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const sendMessage = () => {
    if (socket && message.trim()) {
      const msg = {
        id,
        user: loggedUser,
        avatar: avatar,
        text: message,
        time: getCurrentTime(),
      };

      socket.emit('message', msg);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !dark;
    localStorage.setItem("dark", newDarkMode ? "dark" : "light");
    setDark(newDarkMode);
    const chatElement = document.getElementById('main-chat');
    if (chatElement) {
      chatElement.classList.toggle('dark', newDarkMode);
    }
  };

  const toggleParticipants = () => {
    setShowParticipants(!showParticipants);
  };

  const handleNewChat = () => {
    if (newChatName.trim()) {
      window.open(`${window.location.origin}?room=${newChatName}`, "_self");
      setShowModal(false);
    }
  };

  return (
    <div id="main-chat" className="relative flex flex-col w-full h-screen">
      <header className='bg-gray-200 dark:bg-gray-800 flex flex-row justify-between p-4'>
        <div className='flex flex-row gap-2 items-center'>
          <p className="text-gray-800 dark:text-white font-semibold text-sm md:text-lg">
            Chat: <span className='font-normal md:font-thin'>{room}</span>
          </p>
          <button className="flex items-center justify-center rounded-full w-4 h-4 md:w-6 md:h-6 border border-gray-800 dark:border-white text-gray-800 dark:text-white" onClick={() => setShowModal(true)}>
            <IoAdd className='text-gray-800 dark:text-white' />
          </button>
        </div>
        <div className='flex flex-row gap-2 items-center'>
          <button className='flex flex-row gap-1 rounded-full h-6 text-sm items-center px-2 bg-slate-300 dark:bg-slate-900 text-gray-800 dark:text-white ' onClick={toggleParticipants}>
            <div className='w-2 h-2 rounded-full bg-green-600'></div>
            {participants.length} online
          </button>
          {showParticipants && (
            <div className="shadow-lg absolute z-10 top-12 right-16 bg-white dark:bg-gray-950 border rounded-md p-2 mt-1">
              {participants.map((p) => (
                <div key={p.id} className='flex flex-row items-center px-2 py-1 gap-2'>
                  <span>{p.avatar}</span>
                  <span className='text-gray-800 dark:text-white'>{p.user}</span>
                </div>
              ))}
            </div>
          )}
          <button className='text-gray-800 dark:text-white px-2' onClick={toggleDarkMode}>
            {dark ? <IoSunnyOutline className='w-4 h-4 md:w-6 md:h-6' /> : <IoMoonOutline className='w-4 h-4 md:w-6 md:h-6' />}
          </button>
        </div>
      </header>

      <div className="flex flex-col flex-grow p-4 overflow-y-auto bg-[#e5ddd5] dark:bg-gray-950 gap-2">
        {messages.map((msg, index) => (
          <div className={`flex flex-row gap-2 items-start w-full ${msg.user === loggedUser ? 'flex-row' : 'flex-row-reverse'}`} key={index}>
            <div className={`shadow-md flex text-2xl items-center justify-center w-10 h-10 rounded-full ${msg.user === loggedUser ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-600'}`}>
              {msg.avatar || msg.user.substring(0, 1)}
            </div>
            <div className={`w-11/12 md:w-full shadow-md my-1 p-2 gap-1 text-sm flex flex-col relative ${msg.user === loggedUser ? 'ml-auto rounded-lg rounded-tl-none bg-green-300 dark:bg-green-700' : 'mr-auto rounded-lg rounded-tr-none bg-gray-200 dark:bg-gray-600'}`}>
              <p className='text-sm font-bold text-gray-800 dark:text-white'>{msg.user}</p>
              <p className='text-gray-800 dark:text-white'>{msg.text}</p>
              <p className="text-gray-800 dark:text-white text-xs text-right leading-none">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-200 dark:bg-gray-800 p-4 flex items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <button onClick={sendMessage} className="ml-4">
          <IoMdSend className='w-8 h-8 text-gray-600 dark:text-gray-300' />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-md shadow-lg">
            <h2 className="text-lg text-gray-800 dark:text-gray-100 font-bold mb-2">Create new chat</h2>
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Chat name..."
              className="text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setShowModal(false)} className="w-full px-4 py-2 bg-transparent text-red-600 border border-red-600 rounded-md">Discard</button>
              <button onClick={handleNewChat} className="w-full px-4 py-2 bg-green-500 text-white rounded-md">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
