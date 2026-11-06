import {
  AlertTriangle, ArrowLeft, ArrowRight, Bell, BookOpen, Bookmark, Briefcase, Calendar, Camera, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Clock, Coffee, Compass, Eye, EyeOff, Flag, Gift, Globe, Heart, HelpCircle, Image,
  Hourglass, Info, Key, LifeBuoy, Lock, LogOut, Mail, Map, MapPin, MessageCircle, Moon, Navigation, Pencil, Plus,
  RefreshCw, Search, Send, Settings, Share2, Shield, Slash, SlidersHorizontal, Star, Trash2, User, Users, Wrench, X,
} from "lucide-react";

// Blossom's one icon set: Lucide line icons (the app uses Feather, the same
// drawings). Names are Feather's, so the app and the website say the same
// thing: "map-pin", "arrow-left", "trash-2"... Emoji stay for the fun moments
// (gifts, matches), never as interface icons.
const ICONS = {
  "alert-triangle": AlertTriangle,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  bell: Bell,
  "book-open": BookOpen,
  bookmark: Bookmark,
  briefcase: Briefcase,
  calendar: Calendar,
  camera: Camera,
  check: Check,
  "check-circle": CircleCheck,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  clock: Clock,
  coffee: Coffee,
  compass: Compass,
  "edit-2": Pencil,
  eye: Eye,
  "eye-off": EyeOff,
  flag: Flag,
  gift: Gift,
  globe: Globe,
  heart: Heart,
  "help-circle": HelpCircle,
  hourglass: Hourglass,
  image: Image,
  info: Info,
  key: Key,
  "life-buoy": LifeBuoy,
  lock: Lock,
  "log-out": LogOut,
  mail: Mail,
  map: Map,
  "map-pin": MapPin,
  "message-circle": MessageCircle,
  moon: Moon,
  navigation: Navigation,
  plus: Plus,
  "refresh-cw": RefreshCw,
  search: Search,
  send: Send,
  settings: Settings,
  "share-2": Share2,
  shield: Shield,
  slash: Slash,
  sliders: SlidersHorizontal,
  star: Star,
  tool: Wrench,
  "trash-2": Trash2,
  user: User,
  users: Users,
  x: X,
};

// Arrows and chevrons point the reading way: mirrored in Arabic (ui.module.css).
const DIRECTIONAL = new Set(["arrow-left", "arrow-right", "chevron-left", "chevron-right"]);

export default function Icon({ name, size = 20, color = "currentColor", strokeWidth = 2, className, style }) {
  const Component = ICONS[name];
  if (!Component) return null;
  const classes = [DIRECTIONAL.has(name) && "ui-mirror-rtl", className].filter(Boolean).join(" ");
  return (
    <Component
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={classes || undefined}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    />
  );
}
