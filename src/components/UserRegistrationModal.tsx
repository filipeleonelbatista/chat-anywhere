"use client";
import React, { useState } from "react";
import { AvatarSelector } from "./AvatarSelector";
import { isValidEmail, isValidName } from "@/utils/validation";
import { sanitizeName } from "@/utils/sanitize";

interface Props {
  roomId: string;
  onRegister: (name: string, email: string, avatar: string) => void;
}

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
    if (!isValidName(name)) newErrors.name = "Name must be 2-50 characters";
    if (!isValidEmail(email)) newErrors.email = "Please enter a valid email";
    if (!avatar) newErrors.avatar = "Please select an avatar";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onRegister(sanitizeName(name), email.trim(), avatar);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          Join #{roomId}
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          Choose your identity to start chatting
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Choose Avatar
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
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-whatsapp-green focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Your name"
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
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white font-semibold rounded-lg transition-colors"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
}
