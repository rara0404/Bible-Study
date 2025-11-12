import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, Flame, Star, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { markStreakToday } from "../services/readingProgress";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string;
  totalDaysRead: number;
}

export function StreakTracker() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: '',
    totalDaysRead: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('bibleStreakData');
    if (saved) {
      const data = JSON.parse(saved);
      // Check if last read was yesterday or today
      const lastRead = new Date(data.lastReadDate);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Reset streak if more than 1 day gap
      if (lastRead.toDateString() !== today.toDateString() && 
          lastRead.toDateString() !== yesterday.toDateString()) {
        data.currentStreak = 0;
      }
      
      setStreakData(data);
    }
  }, []);

  const markTodayAsRead = async () => {
    // Local update
    setStreakData(prev => {
      const today = new Date().toDateString();
      if (prev.lastReadDate === today) return prev;
      const newStreak = prev.currentStreak + 1;
      const newData = {
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastReadDate: today,
        totalDaysRead: prev.totalDaysRead + 1
      };
      localStorage.setItem('bibleStreakData', JSON.stringify(newData));
      return newData;
    });
    // Best-effort backend update
    try { await markStreakToday(); } catch {/* ignore */}
  };

  const isReadToday = streakData.lastReadDate === new Date().toDateString();

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-2 border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <Flame className="w-5 h-5" />
          Reading Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
            {streakData.currentStreak}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {streakData.currentStreak === 1 ? 'Day' : 'Days'} in a row
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-sm">Best</span>
            </div>
            <div className="text-xl font-semibold">{streakData.longestStreak}</div>
          </div>
          
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Total</span>
            </div>
            <div className="text-xl font-semibold">{streakData.totalDaysRead}</div>
          </div>
        </div>

        {!isReadToday ? (
          <Button 
            onClick={markTodayAsRead}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Target className="w-4 h-4 mr-2" />
            Mark Today Complete
          </Button>
        ) : (
          <div className="w-full p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-center">
            Great job reading today!
          </div>
        )}
      </CardContent>
    </Card>
  );
}