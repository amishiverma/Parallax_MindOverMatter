import React from "react";
import "./ShinyText.css";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  shineWidth?: number;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 2.5,
  className = "",
  color = "#e2e8f0",
  shineColor = "#ffffff",
  shineWidth = 50,
}) => {
  const animationDuration = `${speed}s`;

  return (
    <div
      className={`shiny-text ${disabled ? "disabled" : ""} ${className}`}
      style={{
        color: "transparent",
        backgroundImage: `linear-gradient(120deg, ${color} calc(50% - ${shineWidth}px), ${shineColor} 50%, ${color} calc(50% + ${shineWidth}px))`,
        backgroundSize: "250% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        animationDuration: animationDuration,
      }}
    >
      {text}
    </div>
  );
};

export default ShinyText;
