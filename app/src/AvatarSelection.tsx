"use client"

import React from 'react';

interface AvatarSelectionProps {
  setAvatar: (avatar: string) => void;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ setAvatar }) => {
  const avatars = ['😎', '🤓', '😇', '🥳', '👽', '🫠']; 

  const handleSelect = (avatar: string) => {
    setAvatar(avatar);
    localStorage.setItem('avatar', avatar); 
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">Escolha um Avatar:</h3>
      <div className="grid grid-cols-3 gap-4">
        {avatars.map((av, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(av)}
            className="shadow-md text-4xl p-4 border rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {av}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AvatarSelection;
