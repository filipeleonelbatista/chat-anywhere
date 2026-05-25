"use client";
import React, { useState, useEffect } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors text-sm"
      aria-label={dark ? "Modo claro" : "Modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
