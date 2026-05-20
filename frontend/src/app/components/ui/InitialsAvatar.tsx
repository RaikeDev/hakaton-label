import { useEffect, useState } from "react";

const PALETTE = [
  "#2F6FED",
  "#7C5CFC",
  "#14B8A6",
  "#EAB308",
  "#F97316",
  "#EC4899",
  "#22C55E",
  "#06B6D4",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, src, size = 40, className = "" }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const dimension = { width: size, height: size };
  const showImage = Boolean(src) && !failed;

  if (showImage) {
    return (
      <img
        src={src as string}
        alt={name}
        style={dimension}
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ ...dimension, background: colorFor(name), fontSize: Math.max(11, size * 0.4) }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
    >
      {initials(name)}
    </div>
  );
}
