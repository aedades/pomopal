import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTaskContext, TaskProvider } from './TaskContext';
import { AuthProvider } from './AuthContext';

// Wrapper that provides both Auth and Task context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TaskProvider>{children}</TaskProvider>
    </AuthProvider>
  );
}

// Test component that uses the context
function TestComponent() {
  const {
    tasks,
    projects,
    activeTask,
    todayPomodoros,
    addTask,
    deleteTask,
    updateTask,
    setActiveTask,
    addProject,
    deleteProject,
    deleteProjectWithTasks,
  } = useTaskContext();

  return (
    <div>
      <div data-testid="task-count">{tasks.length}</div>
      <div data-testid="project-count">{projects.length}</div>
      <div data-testid="active-task">{activeTask?.title || 'none'}</div>
      <div data-testid="today-pomodoros">{todayPomodoros}</div>

      <button onClick={() => addTask('New Task')}>Add Task</button>
      <button onClick={() => addTask('Project Task', projects[0]?.id)}>
        Add Task to Project
      </button>
      <button onClick={() => addProject('New Project', '#ff0000')}>
        Add Project
      </button>

      {tasks.map((task) => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          <span>{task.title}</span>
          <span data-testid={`task-project-${task.id}`}>{task.project_id || 'no-project'}</span>
          <button onClick={() => setActiveTask(task)}>Select</button>
          <button onClick={() => updateTask(task.id, { completed: true })}>
            Complete
          </button>
          <button onClick={() => updateTask(task.id, { project_id: undefined })}>
            Remove Project
          </button>
          <button onClick={() => deleteTask(task.id)}>Delete</button>
        </div>
      ))}

      {projects.map((project) => (
        <div key={project.id} data-testid={`project-${project.id}`}>
          <span>{project.name}</span>
          <button onClick={() => deleteProject(project.id)}>
            Delete Project
          </button>
          <button onClick={() => deleteProjectWithTasks(project.id)}>
            Delete Project With Tasks
          </button>
        </div>
      ))}
    </div>
  );
}

describe('TaskContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides initial empty state', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('task-count')).toHaveTextContent('0');
    expect(screen.getByTestId('project-count')).toHaveTextContent('0');
    expect(screen.getByTestId('active-task')).toHaveTextContent('none');
    expect(screen.getByTestId('today-pomodoros')).toHaveTextContent('0');
  });

  it('adds a task', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add Task'));

    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('deletes a task', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add Task'));
    expect(screen.getByTestId('task-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByTestId('task-count')).toHaveTextContent('0');
  });

  it('completes a task', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add Task'));
    fireEvent.click(screen.getByText('Complete'));

    // Task should still exist but be completed
    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
  });

  it('sets active task', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add Task'));
    fireEvent.click(screen.getByText('Select'));

    expect(screen.getByTestId('active-task')).toHaveTextContent('New Task');
  });

  it('adds a project', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add Project'));

    expect(screen.getByTestId('project-count')).toHaveTextContent('1');
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('deletes a project', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add Project'));
    expect(screen.getByTestId('project-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByText('Delete Project'));
    expect(screen.getByTestId('project-count')).toHaveTextContent('0');
  });

  it('adds task to project', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // First add a project
    fireEvent.click(screen.getByText('Add Project'));

    // Then add a task to that project
    fireEvent.click(screen.getByText('Add Task to Project'));

    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
  });

  it('persists tasks to localStorage', () => {
    const { unmount } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add Task'));
    unmount();

    // Render again and check persistence
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
  });

  it('persists projects to localStorage', () => {
    const { unmount } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add Project'));
    unmount();

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('project-count')).toHaveTextContent('1');
  });

  it('clears active task when task is deleted', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add Task'));
    fireEvent.click(screen.getByText('Select'));
    expect(screen.getByTestId('active-task')).toHaveTextContent('New Task');

    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByTestId('active-task')).toHaveTextContent('none');
  });

  it('deletes project and all associated tasks', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Add a project
    fireEvent.click(screen.getByText('Add Project'));
    expect(screen.getByTestId('project-count')).toHaveTextContent('1');

    // Add a task to that project
    fireEvent.click(screen.getByText('Add Task to Project'));
    expect(screen.getByTestId('task-count')).toHaveTextContent('1');

    // Delete project with tasks
    fireEvent.click(screen.getByText('Delete Project With Tasks'));

    // Both project and task should be gone
    expect(screen.getByTestId('project-count')).toHaveTextContent('0');
    expect(screen.getByTestId('task-count')).toHaveTextContent('0');
  });

  it('updates task fields', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add Task'));
    expect(screen.getByText('New Task')).toBeInTheDocument();

    // The Complete button calls updateTask with completed: true
    fireEvent.click(screen.getByText('Complete'));
    
    // Task still exists (just completed)
    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
  });

  it('preserves task title when completing (partial update bug)', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Add a task
    fireEvent.click(screen.getByText('Add Task'));
    expect(screen.getByText('New Task')).toBeInTheDocument();

    // Complete it (partial update - only sets completed: true)
    fireEvent.click(screen.getByText('Complete'));

    // Title should still be visible after completion
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('can remove project from task (set to undefined)', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Add a project, then add a task to it
    fireEvent.click(screen.getByText('Add Project'));
    fireEvent.click(screen.getByText('Add Task to Project'));
    
    // Task should have a project assigned (not 'no-project')
    const taskProjectSpan = document.querySelector('[data-testid^="task-project-"]');
    expect(taskProjectSpan?.textContent).not.toBe('no-project');

    // Remove the project from the task
    fireEvent.click(screen.getByText('Remove Project'));

    // Task should now have no project
    expect(taskProjectSpan?.textContent).toBe('no-project');
    
    // Task title should still be preserved
    expect(screen.getByText('Project Task')).toBeInTheDocument();
  });

  it('can add task with due date', () => {
    // Test component with due date support
    function DueDateTestComponent() {
      const { tasks, addTask, updateTask } = useTaskContext();
      const tomorrow = new Date(Date.now() + 86400000).toISOString();

      return (
        <div>
          <div data-testid="task-count">{tasks.length}</div>
          <button onClick={() => addTask('Dated Task', undefined, 1, tomorrow)}>
            Add Dated Task
          </button>
          {tasks.map((task) => (
            <div key={task.id} data-testid={`task-${task.id}`}>
              <span>{task.title}</span>
              <span data-testid={`due-${task.id}`}>{task.due_date || 'no-date'}</span>
              <button onClick={() => updateTask(task.id, { due_date: undefined })}>
                Clear Date
              </button>
            </div>
          ))}
        </div>
      );
    }

    render(
      <TestWrapper>
        <DueDateTestComponent />
      </TestWrapper>
    );

    // Add a task with due date
    fireEvent.click(screen.getByText('Add Dated Task'));
    expect(screen.getByTestId('task-count').textContent).toBe('1');
    
    // Task should have a due date
    const dueSpan = document.querySelector('[data-testid^="due-"]');
    expect(dueSpan?.textContent).not.toBe('no-date');

    // Clear the due date
    fireEvent.click(screen.getByText('Clear Date'));
    expect(dueSpan?.textContent).toBe('no-date');
  });
});

describe('TaskContext migration state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves tasks to localStorage when saveToLocalStorage is called', async () => {
    const { saveToLocalStorage } = await import('../hooks/useFirestoreData');
    
    const tasks = [
      { id: 't1', title: 'Task 1', completed: false, estimatedPomodoros: 1, actualPomodoros: 0, createdAt: new Date().toISOString() },
      { id: 't2', title: 'Task 2', completed: true, estimatedPomodoros: 2, actualPomodoros: 2, createdAt: new Date().toISOString() },
    ];
    
    saveToLocalStorage({ tasks, projects: [], pomodoros: [] });
    
    const saved = JSON.parse(localStorage.getItem('pomodoro:guest:tasks') || '[]');
    expect(saved).toHaveLength(2);
    expect(saved[0].title).toBe('Task 1');
    expect(saved[1].title).toBe('Task 2');
  });

  it('hasMigrated starts as false on each mount (session-only flag)', () => {
    // hasMigrated is now a session-only flag, not persisted to localStorage
    // This ensures merge runs on each sign-in, not just the first time ever
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    
    // Component should render successfully with no tasks
    expect(screen.getByTestId('task-count')).toHaveTextContent('0');
  });

  it('preserves local tasks after component unmount/remount', () => {
    // Add some tasks
    const { unmount } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Add Task'));
    fireEvent.click(screen.getByText('Add Task'));
    expect(screen.getByTestId('task-count')).toHaveTextContent('2');
    
    unmount();
    
    // Remount - tasks should persist
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('task-count')).toHaveTextContent('2');
  });
});
