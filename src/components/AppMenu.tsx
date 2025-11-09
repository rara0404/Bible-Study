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
}

export function AppMenu({ onNavigate }: AppMenuProps) {
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
        <MenuIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        data-debug="appmenu-content"
        /* Keep alignment simple first; can reintroduce alignOffset after confirming visibility */
        align="end"
        side="bottom"
        sideOffset={6}
        avoidCollisions={false}
        className="w-56 md:w-60 p-2 rounded-xl bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={() => go("home")}
          className="group px-3 py-2 rounded-md cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Home className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          Home
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => go("books")}
          className="group px-3 py-2 rounded-md cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Book className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          Bible
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => go("read")}
          className="group px-3 py-2 rounded-md cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <BookOpen className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          Read
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => go("favorites")}
          className="group px-3 py-2 rounded-md cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Heart className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          Favorites
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}