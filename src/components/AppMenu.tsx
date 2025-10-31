import { useState } from "react";
import { Menu as MenuIcon, Home, Book, BookOpen, Heart } from "lucide-react";
import { Button } from "./ui/button";
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
  const [open, setOpen] = useState(false);
  const go = (view: AppView) => {
    onNavigate?.(view);
    setOpen(false); // close after click
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 w-10 p-0 rounded-xl border-0 ring-0 bg-white/70 dark:bg-gray-900/60 hover:bg-white dark:hover:bg-gray-800 shadow-sm hover:shadow-md transition"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        sideOffset={10}
        className="w-72 md:w-80 p-2 rounded-2xl bg-white/90 dark:bg-gray-900/85 backdrop-blur-xl shadow-xl border border-gray-200/60 dark:border-gray-700/60"
      >
        <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Menu
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={() => go("home")}
          className="group px-3 py-2 rounded-lg cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Home className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          Home
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => go("books")}
          className="group px-3 py-2 rounded-lg cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Book className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          Bible
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => go("read")}
          className="group px-3 py-2 rounded-lg cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <BookOpen className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          Read
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => go("favorites")}
          className="group px-3 py-2 rounded-lg cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Heart className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          Favorites
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}