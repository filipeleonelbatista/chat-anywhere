"use client"

import { useRouter } from 'next/router';
import { useEffect } from 'react';

const RoomPage: React.FC = () => {
  const router = useRouter();
  const { room } = router.query;

  useEffect(() => {
    if (typeof room === 'string') {
      // Redireciona para a página principal com o parâmetro 'room' incluído
      router.push(`/?room=${encodeURIComponent(room)}`);
    }
  }, [room, router]);

  // Verifica se o parâmetro 'room' está presente
  if (typeof room !== 'string') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-lg mb-4">Você está sendo redirecionado para a página principal...</p>
          <p className="text-gray-500">Se o redirecionamento não ocorrer automaticamente, <a href="/" className="text-blue-500 underline">clique aqui</a>.</p>
        </div>
      </div>
    );
  }

  return null; // Não renderiza nada se o parâmetro 'room' for uma string
};

export default RoomPage;
