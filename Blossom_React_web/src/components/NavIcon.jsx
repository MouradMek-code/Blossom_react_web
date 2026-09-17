import { useId } from "react";

// The same line art as the app's tab bar, drawn inline so the site needs no
// icon package. Each icon is 24x24 and takes the colour of its parent.
const GEAR =
  "M10.07 4.24L10.45 1.72L13.55 1.72L13.93 4.24L16.13 5.15L18.18 3.63L20.37 5.82L18.85 7.87" +
  "L19.76 10.07L22.28 10.45L22.28 13.55L19.76 13.93L18.85 16.13L20.37 18.18L18.18 20.37" +
  "L16.13 18.85L13.93 19.76L13.55 22.28L10.45 22.28L10.07 19.76L7.87 18.85L5.82 20.37" +
  "L3.63 18.18L5.15 16.13L4.24 13.93L1.72 13.55L1.72 10.45L4.24 10.07L5.15 7.87L3.63 5.82" +
  "L5.82 3.63L7.87 5.15Z";

function shapes(name, maskId) {
  switch (name) {
    // Two cards, the way a swipe deck looks: the back one is hidden where the
    // front card sits, so the outlines never cross.
    case "browse":
      return (
        <>
          <mask id={maskId}>
            <rect width="24" height="24" fill="white" />
            <rect
              x="3.4"
              y="6.2"
              width="12.4"
              height="14.6"
              rx="2.6"
              fill="black"
              stroke="black"
              strokeWidth="3"
            />
          </mask>
          <rect
            x="8.6"
            y="3.4"
            width="12"
            height="14.2"
            rx="2.6"
            transform="rotate(13 14.6 10.5)"
            mask={`url(#${maskId})`}
          />
          <rect x="3.4" y="6.2" width="12.4" height="14.6" rx="2.6" />
        </>
      );
    case "likes":
      return (
        <path d="M12 20.3 4.9 13.2a4.6 4.6 0 0 1 0-6.5 4.6 4.6 0 0 1 6.5 0l.6.6.6-.6a4.6 4.6 0 0 1 6.5 0 4.6 4.6 0 0 1 0 6.5z" />
      );
    case "spots":
      return (
        <>
          <path d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
          <circle cx="12" cy="10.2" r="2.7" />
        </>
      );
    case "chats":
      return (
        <path d="M20.5 11.7c0 4.2-3.8 7.6-8.5 7.6a9.8 9.8 0 0 1-2.9-.4L4.2 20.4l1.4-3.9a7.2 7.2 0 0 1-2.1-4.8c0-4.2 3.8-7.6 8.5-7.6s8.5 3.4 8.5 7.6z" />
      );
    case "profile":
      return (
        <>
          <circle cx="12" cy="8.2" r="4.1" />
          <path d="M4.8 20.4a7.2 7.2 0 0 1 14.4 0" />
        </>
      );
    case "settings":
      return (
        <>
          <path d={GEAR} />
          <circle cx="12" cy="12" r="3.4" />
        </>
      );
    case "logout":
      return (
        <>
          <path d="M14.5 16.5v2.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 18.7V5.3a1.8 1.8 0 0 1 1.8-1.8h6.9a1.8 1.8 0 0 1 1.8 1.8v2.2" />
          <path d="M18.4 15.4 21.8 12l-3.4-3.4" />
          <path d="M21.8 12H9.6" />
        </>
      );
    default:
      return null;
  }
}

export default function NavIcon({ name, size = 22 }) {
  // useId contains colons, which url(#...) can't reference - strip them.
  const maskId = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shapes(name, `cards-${maskId}`)}
    </svg>
  );
}
