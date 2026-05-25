"use client";
import React, { useState } from "react";
import { AvatarSelector } from "./AvatarSelector";
import { isValidEmail, isValidName } from "@/utils/validation";
import { sanitizeName } from "@/utils/sanitize";

interface Props {
  roomId: string;
  onRegister: (name: string, email: string, avatar: string) => void;
}

const FEATURES = [
  {
    icon: "🚀",
    title: "Sem cadastro",
    desc: "Escolha um nome e avatar para entrar. Não precisa de senha.",
  },
  {
    icon: "🔒",
    title: "Privacidade total",
    desc: "Nenhuma mensagem é armazenada permanentemente. Tudo expira em 24h.",
  },
  {
    icon: "🖼️",
    title: "Compartilhe imagens",
    desc: "Envie fotos que ficam disponíveis por 24 horas.",
  },
  {
    icon: "🔗",
    title: "Links com preview",
    desc: "Cole um link e veja a prévia automaticamente.",
  },
  {
    icon: "📱",
    title: "Salas por URL",
    desc: "Cada URL é uma sala diferente. Compartilhe o link para convidar.",
  },
];

export function UserRegistrationModal({ roomId, onRegister }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    avatar?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!isValidName(name)) newErrors.name = "Nome deve ter entre 2 e 50 caracteres";
    if (!isValidEmail(email)) newErrors.email = "Insira um email válido";
    if (!avatar) newErrors.avatar = "Selecione um avatar";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onRegister(sanitizeName(name), email.trim(), avatar);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full my-8 mx-4">
        {/* Welcome Section */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">💬</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bem-vindo ao Chat-Anywhere! 🎉
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Chat em tempo real, direto do navegador. Sem cadastro, sem
              complicação.
            </p>
          </div>

          <div className="space-y-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {f.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Form */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Entrar na sala #{roomId}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Preencha os dados abaixo para começar a conversar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Escolha seu avatar
              </label>
              <AvatarSelector selected={avatar} onSelect={setAvatar} />
              {errors.avatar && (
                <p className="text-red-500 text-sm mt-1">{errors.avatar}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-whatsapp-green focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Seu nome"
                maxLength={50}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-whatsapp-green focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white font-semibold rounded-lg transition-colors"
            >
              Entrar no Chat
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
