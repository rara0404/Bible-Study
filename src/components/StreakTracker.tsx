import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, Flame, Star, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { markStreakToday } from "../services/readingProgress";

interface StreakData {
  current_streak?: number;
  currentStreak?: number;
  longest_streak?: number;
  longestStreak?: number;
  last_read_date?: string;
  lastReadDate?: string;
  total_days_read?: number;
  totalDaysRead?: number;
}

interface StreakTrackerProps {
  userId?: number;
}

export function StreakTracker({ userId }: StreakTrackerProps) {
  const [streakData, setStreakData] = useState<StreakData>({
    current_streak: 0,
    longest_streak: 0,
    last_read_date: '',
    total_days_read: 0
  });

  useEffect(() => {
    const loadStreakData = async () => {
      // Load from backend if userId available
      if (userId) {
        try {
          const res = await fetch(`/api/streak?user_id=${userId}`);
          if (res.ok) {
            const data = await res.json();
            setStreakData(data);
            return;
          }
        } catch {/* ignore */}
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('bibleStreakData');
      if (saved) {
        const data = JSON.parse(saved);
        // Check if last read was yesterday or today
        const lastRead = new Date(data.lastReadDate || data.last_read_date || '');
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
    };

    loadStreakData();
  }, [userId]);

  const markTodayAsRead = async () => {
    // Local update
    setStreakData(prev => {
      const today = new Date().toDateString();
      const lastRead = prev.lastReadDate || prev.last_read_date || '';
      if (lastRead === today) return prev;
      const currentCount = (prev.currentStreak || prev.currentStreak === 0) ? prev.currentStreak : 0;
      const longestCount = (prev.longestStreak || prev.longestStreak === 0) ? prev.longestStreak : 0;
      const totalCount = (prev.totalDaysRead || prev.totalDaysRead === 0) ? prev.totalDaysRead : 0;
      const newStreak = currentCount + 1;
      const newData = {
        current_streak: newStreak,
        longest_streak: Math.max(longestCount, newStreak),
        last_read_date: today,
        total_days_read: totalCount + 1
      };
      localStorage.setItem('bibleStreakData', JSON.stringify(newData));
      return newData;
    });
    
    // Backend update if userId available
    if (userId) {
      try {
        await fetch('/api/streak/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
      } catch {/* ignore */}
    } else {
      // Best-effort fallback
      try { await markStreakToday(); } catch {/* ignore */}
    }
  };

  const getLastReadDate = (): string => {
    return streakData.lastReadDate || streakData.last_read_date || '';
  };

  const isReadToday = getLastReadDate() === new Date().toDateString();

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
            {streakData.current_streak || streakData.currentStreak || 0}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {(streakData.current_streak || streakData.currentStreak || 0) === 1 ? 'Day' : 'Days'} in a row
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-sm">Best</span>
            </div>
            <div className="text-xl font-semibold">{streakData.longest_streak || streakData.longestStreak || 0}</div>
          </div>
          
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Total</span>
            </div>
            <div className="text-xl font-semibold">{streakData.total_days_read || streakData.totalDaysRead || 0}</div>
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