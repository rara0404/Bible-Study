import { useState } from "react";
import { Menu as MenuIcon, Home, Book, BookOpen, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

export type AppView = "home" | "books" | "read" | "favorites";

interface AppMenuProps {
  onNavigate?: (view: AppView) => void;
  active?: AppView; // currently selected view
}

export function AppMenu({ onNavigate, active }: AppMenuProps) {
  // Icon sizes
  const TRIGGER_ICON_SIZE = 20; // keep hamburger the same
  const ITEM_ICON_SIZE = 24; // make menu icons bigger
  // Controlled open state to ensure visibility while debugging
  const [open, setOpen] = useState(false);

  const go = (view: AppView) => {
    onNavigate?.(view);
    setOpen(false); // close after navigation
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        data-debug="appmenu-trigger"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center justify-center h-10 w-10 p-0 rounded-xl border border-transparent bg-white/80 dark:bg-gray-900/70 hover:bg-white dark:hover:bg-gray-800 shadow-sm hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label="Open menu"
    >
  <MenuIcon size={TRIGGER_ICON_SIZE} className="text-gray-700 dark:text-gray-200" strokeWidth={2} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        data-debug="appmenu-content"
        /* Keep alignment simple first; can reintroduce alignOffset after confirming visibility */
        align="end"
        side="bottom"
        sideOffset={6}
        avoidCollisions={false}
        className="w-[180px] p-2 space-y-1 bg-white dark:bg-gray-900 shadow-lg"
        style={{ width: 180 }}
      >
        {/* No header/separator to match minimalist design */}
        <DropdownMenuItem
          onClick={() => go("home")}
          className={
            `group w-full h-10 pl-3 pr-3 rounded-md cursor-pointer transition text-[15px] flex items-center gap-0 focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800`
          }
        >
          <span className="inline-flex items-center justify-start w-10 pr-5">
            <Home
              className={
                `p-1.5 ml-2 shrink-0 ${
                  active === "home"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                }`
              }
              size={ITEM_ICON_SIZE}
              strokeWidth={2}
            />
          </span>
          <span className={`flex-1 text-center ${active === "home" ? "font-medium" : ""}`}>Home</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => go("books")}
          className={
            `group w-full h-10 pl-3 pr-3 rounded-md cursor-pointer transition text-[15px] flex items-center gap-0 focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800`
          }
        >
          <span className="inline-flex items-center justify-start w-10 pr-5">
            <Book
              className={
                `p-1.5 ml-2 shrink-0 ${
                  active === "books"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                }`
              }
              size={ITEM_ICON_SIZE}
              strokeWidth={2}
            />
          </span>
          <span className={`flex-1 text-center ${active === "books" ? "font-medium" : ""}`}>Bible</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => go("read")}
          className={
            `group w-full h-10 pl-3 pr-3 rounded-md cursor-pointer transition text-[15px] flex items-center gap-0 focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800`
          }
        >
          <span className="inline-flex items-center justify-start w-10 pr-5">
            <BookOpen
              className={
                `p-1.5 ml-2 shrink-0 ${
                  active === "read"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                }`
              }
              size={ITEM_ICON_SIZE}
              strokeWidth={2}
            />
          </span>
          <span className={`flex-1 text-center ${active === "read" ? "font-medium" : ""}`}>Read</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => go("favorites")}
          className={
            `group w-full h-10 pl-3 pr-3 rounded-md cursor-pointer transition text-[15px] flex items-center gap-0 focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800`
          }
        >
          <span className="inline-flex items-center justify-start w-10 pr-5">
            <Heart
              className={
                `p-1.5 ml-2 shrink-0 ${
                  active === "favorites"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                }`
              }
              size={ITEM_ICON_SIZE}
              strokeWidth={2}
            />
          </span>
          <span className={`flex-1 text-center ${active === "favorites" ? "font-medium" : ""}`}>Favorites</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}