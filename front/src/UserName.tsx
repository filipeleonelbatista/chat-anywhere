"use client"
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface UserNameProps {
  setUserName: (name: string) => void;
}

const UserName: React.FC<UserNameProps> = ({ setUserName }) => {
  const [name, setName] = useState<string>('');

  useEffect(() => {
    const storedName = localStorage.getItem('username') || '';
    setName(storedName);
  }, []);

  const handleSave = () => {
    localStorage.setItem('uid', uuidv4());
    localStorage.setItem('username', name);
    localStorage.setItem('dark', 'light');
    setUserName(name);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h3 className="text-2xl text-gray-800 font-bold mb-6 text-center">Digite seu nome:</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Seu nome"
        className="w-64 p-3 mb-4 text-gray-800 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSave}
        className="w-32 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Salvar Nome
      </button>
    </div>
  );
};

export default UserName;
