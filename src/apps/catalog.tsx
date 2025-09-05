import React from 'react';
import { NotesApp } from './NotesApp';
import { CalculatorApp } from './CalculatorApp';
import { ClockApp } from './ClockApp';
import { PhoneApp } from './PhoneApp';
import { GoogleApp } from './GoogleApp';
import { WeatherApp } from './WeatherApp';
import { SettingsApp } from './SettingsApp';
import { TodoApp } from './TodoApp';
import { FilesApp } from './FilesApp';
import { StopwatchApp } from './StopwatchApp';
import { TimerApp } from './TimerApp';
import { SketchApp } from './SketchApp';
import { AppStore } from './AppStore';
import { AngryBirdsApp } from './AngryBirdsApp';
import { ShortcutsApp } from './ShortcutsApp';

export type LaunchableApp = {
  key: string;
  title: string;
  icon: string;
  initialSize?: { width: number; height: number };
  content: React.ReactNode;
};

export const appsCatalog: LaunchableApp[] = [
  {
    key: 'notes',
    title: 'Notes',
    icon: '📝',
    initialSize: { width: 320, height: 420 },
    content: <NotesApp />,
  },
  {
    key: 'calc',
    title: 'Calculator',
    icon: '🔢',
    initialSize: { width: 300, height: 420 },
    content: <CalculatorApp />,
  },
  {
    key: 'clock',
    title: 'Clock',
    icon: '⏰',
    initialSize: { width: 320, height: 280 },
    content: <ClockApp />,
  },
  {
    key: 'phone',
    title: 'Phone',
    icon: '📞',
    initialSize: { width: 340, height: 520 },
    content: <PhoneApp />,
  },
  {
    key: 'google',
    title: 'Google',
    icon: '🔎',
    initialSize: { width: 360, height: 520 },
    content: <GoogleApp />,
  },
  {
    key: 'weather',
    title: 'Weather',
    icon: '🌤️',
    initialSize: { width: 360, height: 580 },
    content: <WeatherApp />,
  },
  {
    key: 'settings',
    title: 'Settings',
    icon: '⚙️',
    initialSize: { width: 340, height: 360 },
    content: <SettingsApp />,
  },
  {
    key: 'app-store',
    title: 'App Store',
    icon: '🛍️',
    initialSize: { width: 380, height: 560 },
    content: <AppStore />,
  },
  {
    key: 'todo',
    title: 'To-Do',
    icon: '✅',
    initialSize: { width: 340, height: 520 },
    content: <TodoApp />,
  },
  {
    key: 'files',
    title: 'Files',
    icon: '🗂️',
    initialSize: { width: 360, height: 480 },
    content: <FilesApp />,
  },
  {
    key: 'stopwatch',
    title: 'Stopwatch',
    icon: '⏱️',
    initialSize: { width: 320, height: 320 },
    content: <StopwatchApp />,
  },
  {
    key: 'timer',
    title: 'Timer',
    icon: '⏲️',
    initialSize: { width: 320, height: 360 },
    content: <TimerApp />,
  },
  {
    key: 'sketch',
    title: 'Sketch',
    icon: '✏️',
    initialSize: { width: 360, height: 520 },
    content: <SketchApp />,
  },
  {
    key: 'angry-birds',
    title: 'Angry Birds',
    icon: '🐦',
    initialSize: { width: 360, height: 520 },
    content: <AngryBirdsApp />,
  },
  {
    key: 'shortcuts',
    title: 'External Shortcuts',
    icon: '🔗',
    initialSize: { width: 380, height: 520 },
    content: <ShortcutsApp />,
  },
];


