import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./TextType.css";

interface TextTypeProps {
  text: string[] | string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  initialDelay?: number;
  showCursor?: boolean;
  cursorChar?: string;
  cursorColor?: string;
  className?: string;
  startOnVisible?: boolean;
  start?: boolean;
  as?: React.ElementType;
}

export const TextType: React.FC<TextTypeProps> = ({
  text,
  typingSpeed = 35,
  deletingSpeed = 25,
  pauseDuration = 4000,
  initialDelay = 0,
  showCursor = true,
  cursorChar = "|",
  cursorColor = "#ef4444",
  className = "",
  start = true,
  as: Component = "p",
}) => {
  const textArray = Array.isArray(text) ? text : [text];
  const [displayText, setDisplayText] = useState("");
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (cursorRef.current && showCursor) {
      const tween = gsap.to(cursorRef.current, {
        opacity: 0,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
      return () => {
        tween.kill();
      };
    }
  }, [showCursor]);

  useEffect(() => {
    if (!start) {
      setDisplayText("");
      return;
    }

    let currentIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const fullText = textArray[currentIdx];

      if (!isDeleting) {
        charIdx++;
        setDisplayText(fullText.substring(0, charIdx));

        if (charIdx >= fullText.length) {
          if (textArray.length > 1) {
            isDeleting = true;
            timeout = setTimeout(tick, pauseDuration);
            return;
          } else {
            // Stay fully displayed
            return;
          }
        }
        timeout = setTimeout(tick, typingSpeed);
      } else {
        charIdx--;
        setDisplayText(fullText.substring(0, charIdx));

        if (charIdx <= 0) {
          isDeleting = false;
          currentIdx = (currentIdx + 1) % textArray.length;
          timeout = setTimeout(tick, 500);
          return;
        }
        timeout = setTimeout(tick, deletingSpeed);
      }
    };

    timeout = setTimeout(tick, initialDelay > 0 ? initialDelay : typingSpeed);

    return () => clearTimeout(timeout);
  }, [textArray, typingSpeed, deletingSpeed, pauseDuration, initialDelay, start]);

  return (
    <Component className={`inline-block font-sans ${className}`}>
      <span>{displayText}</span>
      {showCursor && (
        <span
          ref={cursorRef}
          style={{ color: cursorColor }}
          className="text-type-cursor ml-0.5 font-mono select-none"
        >
          {cursorChar}
        </span>
      )}
    </Component>
  );
};

export default TextType;
