import { useState, useMemo, useRef } from "react";
import { Languages, ChevronDown, Info } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "./ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./ui/collapsible";
import { Button } from "./ui/button";
import "./TranslationSelector.css";
import { BibleTranslations, getAllTranslations, getDefaultTranslation, hasApiResource } from "../services/bibleApi";

interface TranslationSelectorProps {
  selectedTranslation?: string;
  onTranslationChange: (translationId: string) => void;
  showDetails?: boolean;
}

export function TranslationSelector({
  selectedTranslation,
  onTranslationChange,
  showDetails = false,
}: TranslationSelectorProps) {
  // Coerce to a supported translation if an unsupported one was persisted/selected
  const idRaw = selectedTranslation || getDefaultTranslation().identifier;
  const currentTranslation = hasApiResource(idRaw)
    ? idRaw
    : getDefaultTranslation().identifier;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedInfo = useMemo(
    () => Object.values(BibleTranslations).find(t => t.identifier === currentTranslation),
    [currentTranslation]
  );

  // Group once
  const translationsByLanguage = useMemo(() => {
    // Only include translations that have an API resource
    return getAllTranslations()
      .filter(t => hasApiResource(t.identifier))
      .reduce((groups, translation) => {
        const language = translation.language;
        if (!groups[language]) groups[language] = [];
        groups[language].push(translation);
        return groups;
      }, {} as Record<string, typeof BibleTranslations[keyof typeof BibleTranslations][]>);
  }, []);

  if (!showDetails) {
    return (
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 transition-colors shrink-0 size-10 flex items-center justify-center">
          <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>

        <Select
          value={currentTranslation}
          onValueChange={onTranslationChange}
          onOpenChange={(open) => {
            if (open) {
              requestAnimationFrame(() => {
                const scroller = contentRef.current?.querySelector(".ts-scroll,[data-radix-select-viewport]") as HTMLElement | null;
                if (scroller) {
                  scroller.scrollTop = 0;
                  setTimeout(() => (scroller.scrollTop = 0), 40);
                }
              });
            }
          }}
        >
          <SelectTrigger
            aria-label="Select Bible translation"
            // Fixed, responsive widths with truncation so the button doesn’t resize
            className="h-10 w-[12rem] sm:w-[14rem] md:w-[16rem] lg:w-[18rem] min-w-[12rem] sm:min-w-[14rem] md:min-w-[16rem] lg:min-w-[18rem] max-w-[18rem] truncate justify-between border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800 data-[state=open]:ring-2 data-[state=open]:ring-blue-200 dark:data-[state=open]:ring-blue-900/40 shrink-0"
          >
            <SelectValue placeholder="Select translation" />
          </SelectTrigger>

          <SelectContent
            ref={contentRef}
            position="popper"
            align="end"
            sideOffset={8}
            className="w-80 p-1 shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg"
          >
            <div className="ts-scroll pr-1">
              {Object.entries(translationsByLanguage).map(([language, list]) => (
                <SelectGroup key={language} className="mb-2">
                  <SelectLabel className="px-2 py-1 text-[11px] tracking-wide uppercase text-gray-500 dark:text-gray-400">
                    {language}
                  </SelectLabel>
                  {list.map((t) => (
                    <SelectItem
                      key={t.identifier}
                      value={t.identifier}
                      textValue={t.name}
                      className="group relative cursor-pointer rounded-md px-2 py-2 transition-colors
                                 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700
                                 dark:data-[state=checked]:bg-blue-900/30 dark:data-[state=checked]:text-blue-300
                                 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{t.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.language}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Detailed view with enhanced collapsible sections
  return (
    <Card className="shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
            <Languages className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bible Translations
          </span>
        </CardTitle>
        {selectedInfo && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Currently using:</span>
            <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300">
              {selectedInfo.name}
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              {selectedInfo.language}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(translationsByLanguage).map(([language, translations]) => (
            <Collapsible key={language} open={language === 'English' || isOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700 rounded-lg group"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      {language}
                    </h3>
                    <Badge 
                      variant="secondary" 
                      className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300 transition-colors"
                    >
                      {translations.length}
                    </Badge>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-200 group-hover:scale-110" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3 ml-4">
                {translations.map((translation) => (
                  <div
                    key={translation.identifier}
                    className="group p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600"
                    onClick={() => onTranslationChange(translation.identifier)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {translation.name}
                          </h4>
                        </div>
                        <p className="text-sm mb-2 text-gray-600 dark:text-gray-400">
                          {translation.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                            {translation.identifier.toUpperCase()}
                          </Badge>
                          <span className="text-gray-500 dark:text-gray-500">
                            {translation.license}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
        
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-200 dark:border-blue-700 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                About Bible Translations
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                Different Bible translations serve different purposes. Some prioritize literal accuracy, 
                others focus on readability. All translations listed here are in the public domain and 
                freely available through the Bible API.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for managing translation selection with localStorage persistence
export function useTranslationSelection() {
  const [selectedTranslation, setSelectedTranslation] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedBibleTranslation');
      return saved || getDefaultTranslation().identifier;
    }
    return getDefaultTranslation().identifier;
  });

  const handleTranslationChange = (translationId: string) => {
    setSelectedTranslation(translationId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBibleTranslation', translationId);
    }
  };

  return {
    selectedTranslation,
    handleTranslationChange,
    translationInfo: Object.values(BibleTranslations).find(t => t.identifier === selectedTranslation)
  };
}