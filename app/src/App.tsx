"use client"

import React, { useEffect, useState } from 'react';
import AvatarSelection from './AvatarSelection';
import ChatRoom from './ChatRoom';
import UserName from './UserName';
import { FaSpinner } from 'react-icons/fa';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setUserName(localStorage.getItem('username') || '');
    setAvatar(localStorage.getItem('avatar') || '');

    setTimeout(() => {
      setIsLoading(false)
    }, 2500)
  }, []);

  return (
    <div className="min-h-screen bg-gray-600 flex flex-col items-center justify-center">
      {
        isLoading ? (
          <div className='h-screen w-screen z-10 absolute bg-gray-950/30 flex items-center justify-center'>
            <FaSpinner className='w-10 h-10 text-green-600 animate-spin' />
          </div>
        ) : (
          <>
            {!userName ? (
              <div className="w-full">
                <UserName setUserName={setUserName} />
              </div>
            ) : !avatar ? (
              <div className="w-full">
                <AvatarSelection setAvatar={setAvatar} />
              </div>
            ) : (
              <div className="w-full h-full">
                <ChatRoom />
              </div>
            )}
          </>
        )
      }
    </div>
  );
};

export default App;
