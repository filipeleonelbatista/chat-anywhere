import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface UserNameProps {
  setUserName: (name: string) => void;
}

const UserName: React.FC<UserNameProps> = ({ setUserName }) => {
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('username') || '';
    setName(storedName);
  }, []);

  const sanitizeName = (input: string): string => {
    const sanitized = input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
    return sanitized;
  };

  const handleSave = () => {
    const sanitized = sanitizeName(name.trim());

    if (sanitized.length > 30) {
      setError('The name cannot be longer than 30 characters..');
      return;
    }

    if (sanitized.length === 0) {
      setError('Name cannot be empty.');
      return;
    }

    setError(null);
    localStorage.setItem('uid', uuidv4());
    localStorage.setItem('username', sanitized);
    localStorage.setItem('dark', 'light');
    setUserName(sanitized);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h3 className="text-2xl text-gray-800 font-bold mb-6 text-center">Type a name:</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: John Doe"
        maxLength={30}
        className="w-64 p-3 mb-4 text-gray-800 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && (
        <div className="text-red-500 mb-4 text-sm text-center">{error}</div>
      )}
      <button
        onClick={handleSave}
        className="w-32 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Save
      </button>
    </div>
  );
};

export default UserName;
