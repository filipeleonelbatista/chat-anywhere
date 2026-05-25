"use client";
import React, { createContext, useContext, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { User } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface UserContextType {
  user: User | null;
  register: (name: string, email: string, avatar: string) => void;
  clearUser: () => void;
  isRegistered: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "chat-anywhere:user";

export function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser, removeUser] = useLocalStorage<User | null>(
    STORAGE_KEY,
    null
  );

  const register = useCallback(
    (name: string, email: string, avatar: string) => {
      const newUser: User = {
        id: uuidv4(),
        name,
        email,
        avatar,
        joinedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
    },
    [setUser]
  );

  const clearUser = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    removeUser();
  }, [removeUser]);

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
