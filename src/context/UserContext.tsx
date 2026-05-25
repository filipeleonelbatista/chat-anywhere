"use client";
import React, { createContext, useContext, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { User } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface UserContextType {
  user: User | null;
  register: (
    name: string,
    email: string,
    avatar: string,
    roomId: string
  ) => void;
  clearUser: (roomId: string) => void;
  isRegistered: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  roomId,
}: {
  children: React.ReactNode;
  roomId: string;
}) {
  const storageKey = `chat-anywhere:${roomId}:user`;
  const [user, setUser, removeUser] = useLocalStorage<User | null>(
    storageKey,
    null
  );

  const register = useCallback(
    (name: string, email: string, avatar: string, rid: string) => {
      const newUser: User = {
        id: uuidv4(),
        name,
        email,
        avatar,
        joinedAt: Date.now(),
      };
      const key = `chat-anywhere:${rid}:user`;
      localStorage.setItem(key, JSON.stringify(newUser));
      setUser(newUser);
    },
    [setUser]
  );

  const clearUser = useCallback(
    (rid: string) => {
      const key = `chat-anywhere:${rid}:user`;
      localStorage.removeItem(key);
      removeUser();
    },
    [removeUser]
  );

  return (
    <UserContext.Provider
      value={{ user, register, clearUser, isRegistered: user !== null }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
