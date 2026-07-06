"use client";

import React, { useEffect, useRef, useState } from "react";

interface TypingTextProps {
  text: string;
  speed?: number; // ms per character
  className?: string;
  cursorClassName?: string;
  onDone?: () => void;
}

/** Reveals text character-by-character, like Aura is speaking it live. */
export default function TypingText({
  text,
  speed = 16,
  className = "",
  cursorClassName = "",
  onDone,
}: TypingTextProps) {
  const [shown, setShown] = useState("");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        onDoneRef.current?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const isTyping = shown.length < text.length;

  return (
    <span className={className}>
      {/* screen readers get the full message immediately; the animation below is purely visual */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {shown}
        {isTyping && (
          <span
            className={`inline-block w-[2px] h-[1em] bg-current align-middle ms-0.5 animate-pulse ${cursorClassName}`}
          />
        )}
      </span>
    </span>
  );
}
