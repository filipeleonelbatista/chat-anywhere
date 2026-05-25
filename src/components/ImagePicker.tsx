"use client";
import React, { useRef, useState } from "react";
import { isValidFileType, isValidFileSize } from "@/utils/validation";

interface Props {
  onSelect: (file: File) => void;
}

export function ImagePicker({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;
    if (!isValidFileType(file)) {
      setError("Invalid file type. Use JPG, PNG, GIF, or WebP.");
      return;
    }
    if (!isValidFileSize(file)) {
      setError("File too large. Max 5MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    onSelect(file);
  };

  return (
    <div className="absolute bottom-full mb-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-500"
      >
        Choose Image
      </button>
      {preview && (
        <img src={preview} alt="Preview" className="mt-2 max-h-24 rounded" />
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
