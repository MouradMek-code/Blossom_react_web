import { useEffect, useState } from "react";

// True on a computer-sized screen (1024 px and wider), where pages can show
// two columns - e.g. the chat list beside the conversation.
export function useWide(minWidth = 1024) {
  const query = `(min-width: ${minWidth}px)`;
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia?.(query).matches);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return undefined;
    const onChange = () => setWide(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return Boolean(wide);
}
