"use client";
import { useState, useCallback } from "react";

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]}>])/g;

export interface DetectedLink {
  url: string;
  start: number;
  end: number;
}

export function useLinkDetection() {
  const [links, setLinks] = useState<DetectedLink[]>([]);

  const detectLinks = useCallback((text: string): DetectedLink[] => {
    const detected: DetectedLink[] = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(URL_REGEX.source, "g");
    while ((match = regex.exec(text)) !== null) {
      detected.push({
        url: match[1],
        start: match.index,
        end: match.index + match[1].length,
      });
    }
    setLinks(detected);
    return detected;
  }, []);

  const clearLinks = useCallback(() => {
    setLinks([]);
  }, []);

  return { links, detectLinks, clearLinks };
}
