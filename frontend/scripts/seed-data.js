#!/usr/bin/env node
/**
 * Seed script for local development
 * Generates test data in localStorage format
 * 
 * Usage: node scripts/seed-data.js > seed.json
 * Then import in browser console: localStorage.setItem('pomodoro-tasks', JSON.stringify(data.tasks))
 */

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

const projects = [
  { id: 'proj-1', name: 'Work', color: '#3b82f6', completed: false, createdAt: yesterday.toISOString() },
  { id: 'proj-2', name: 'Personal', color: '#22c55e', completed: false, createdAt: yesterday.toISOString() },
  { id: 'proj-3', name: 'Learning', color: '#8b5cf6', completed: false, createdAt: yesterday.toISOString(), dueDate: nextWeek.toISOString() },
];

const tasks = [
  // Work tasks
  { id: 'task-1', title: 'Review pull requests', projectId: 'proj-1', completed: false, estimatedPomodoros: 2, actualPomodoros: 1, createdAt: yesterday.toISOString(), dueDate: today.toISOString() },
  { id: 'task-2', title: 'Write documentation', projectId: 'proj-1', completed: false, estimatedPomodoros: 3, actualPomodoros: 0, createdAt: yesterday.toISOString(), dueDate: tomorrow.toISOString() },
  { id: 'task-3', title: 'Fix bug in auth flow', projectId: 'proj-1', completed: true, completedAt: yesterday.toISOString(), estimatedPomodoros: 2, actualPomodoros: 2, createdAt: yesterday.toISOString() },
  
  // Personal tasks
  { id: 'task-4', title: 'Grocery shopping', projectId: 'proj-2', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: today.toISOString() },
  { id: 'task-5', title: 'Call mom', projectId: 'proj-2', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: today.toISOString(), dueDate: today.toISOString() },
  
  // Learning tasks
  { id: 'task-6', title: 'Read DDIA Chapter 7', projectId: 'proj-3', completed: false, estimatedPomodoros: 4, actualPomodoros: 2, createdAt: yesterday.toISOString(), dueDate: nextWeek.toISOString() },
  { id: 'task-7', title: 'Practice Go exercises', projectId: 'proj-3', completed: false, estimatedPomodoros: 2, actualPomodoros: 0, createdAt: today.toISOString() },
  
  // No project
  { id: 'task-8', title: 'Quick brainstorm', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: today.toISOString() },
];

// Generate some stats (pomodoros completed in the past week)
const stats = [];
for (let i = 6; i >= 0; i--) {
  const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
  const dateStr = date.toISOString().split('T')[0];
  const count = Math.floor(Math.random() * 8) + (i === 0 ? 3 : 1); // More today
  
  for (let j = 0; j < count; j++) {
    const hour = 9 + Math.floor(Math.random() * 10); // 9am - 7pm
    const timestamp = new Date(date);
    timestamp.setHours(hour, Math.floor(Math.random() * 60));
    
    stats.push({
      id: `stat-${dateStr}-${j}`,
      taskId: tasks[Math.floor(Math.random() * tasks.length)].id,
      completedAt: timestamp.toISOString(),
      duration: 25,
    });
  }
}

const seedData = {
  'pomodoro-tasks': JSON.stringify(tasks),
  'pomodoro-projects': JSON.stringify(projects),
  'pomodoro-stats': JSON.stringify(stats),
};

console.log(JSON.stringify(seedData, null, 2));
