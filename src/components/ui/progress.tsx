"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress@1.1.2";
import { CheckCircle, Book, Star, Trophy, Target, BookOpen, Zap, Heart } from 'lucide-react';

import { cn } from "./utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

// Enhanced Reading Progress Notifications Component
interface ReadingNotificationProps {
  type: 'success' | 'milestone' | 'streak' | 'goal' | 'encouragement';
  message: string;
  streak?: number;
  progress?: number;
}

export const ReadingNotification: React.FC<ReadingNotificationProps> = ({ 
  type, 
  message, 
  streak, 
  progress 
}) => {
  const getNotificationConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200',
          iconColor: 'text-green-600 dark:text-green-400'
        };
      case 'milestone':
        return {
          icon: <Trophy className="w-5 h-5" />,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          iconColor: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'streak':
        return {
          icon: <Zap className="w-5 h-5" />,
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          textColor: 'text-orange-800 dark:text-orange-200',
          iconColor: 'text-orange-600 dark:text-orange-400'
        };
      case 'goal':
        return {
          icon: <Target className="w-5 h-5" />,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200',
          iconColor: 'text-blue-600 dark:text-blue-400'
        };
      default:
        return {
          icon: <Heart className="w-5 h-5" />,
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          textColor: 'text-purple-800 dark:text-purple-200',
          iconColor: 'text-purple-600 dark:text-purple-400'
        };
    }
  };

  const config = getNotificationConfig();

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg border-l-4 
      ${config.bgColor} ${config.borderColor} ${config.textColor}
      shadow-sm transition-all duration-200 hover:shadow-md
    `}>
      <div className={`flex-shrink-0 ${config.iconColor}`}>
        {config.icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{message}</p>
        {streak && (
          <p className="text-xs opacity-75 mt-1">
            🔥 {streak} day streak!
          </p>
        )}
        {progress && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-current h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Usage Examples Component
export const ReadingNotificationExamples: React.FC = () => {
  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold mb-4">Enhanced Reading Notifications</h3>
      
      {/* Success - Daily Reading */}
      <ReadingNotification 
        type="success"
        message="Great job reading today!"
      />
      
      {/* Milestone Achievement */}
      <ReadingNotification 
        type="milestone"
        message="Amazing! You've completed your weekly goal!"
        progress={100}
      />
      
      {/* Reading Streak */}
      <ReadingNotification 
        type="streak"
        message="You're on fire! Keep up the great work!"
        streak={7}
      />
      
      {/* Goal Progress */}
      <ReadingNotification 
        type="goal"
        message="You're halfway to your weekly goal!"
        progress={50}
      />
      
      {/* Encouragement */}
      <ReadingNotification 
        type="encouragement"
        message="Every verse matters. Keep growing in faith!"
      />
    </div>
  );
};

// Advanced Progress Card with Enhanced Icons
export const EnhancedProgressCard: React.FC<{
  daysRead: number;
  targetDays: number;
  streak: number;
}> = ({ daysRead, targetDays, streak }) => {
  const progressPercentage = Math.round((daysRead / targetDays) * 100);
  
  const getMotivationalMessage = () => {
    if (progressPercentage === 100) return "🎉 Goal achieved! You're amazing!";
    if (progressPercentage >= 75) return "🔥 Almost there! You've got this!";
    if (progressPercentage >= 50) return "⭐ Great progress! Keep it up!";
    if (progressPercentage >= 25) return "📚 You're building a great habit!";
    return "🌱 Every step counts. You're doing great!";
  };

  const getProgressColor = () => {
    if (progressPercentage >= 75) return 'bg-green-500';
    if (progressPercentage >= 50) return 'bg-blue-500';
    if (progressPercentage >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header with Icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            This Week's Goal
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Build your reading habit
          </p>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {daysRead}/{targetDays} days
          </span>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`${getProgressColor()} h-3 rounded-full transition-all duration-500 ease-out relative`}
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
          {/* Percentage label */}
          <div className="absolute -top-6 right-0 text-xs font-semibold text-gray-600 dark:text-gray-400">
            {progressPercentage}%
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {getMotivationalMessage()}
        </p>
      </div>

      {/* Streak Counter */}
      {streak > 0 && (
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">
            {streak} day reading streak!
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
          Start Reading
        </button>
        <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          <Target className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export { Progress };
