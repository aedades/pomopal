import { useState } from 'react'
import { useTaskContext } from '../context/TaskContext'
import { useSettings } from '../hooks/useSettings'

// Format due date for display
function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  if (dateOnly.getTime() === today.getTime()) {
    // Today - show time if available
    return date.getHours() !== 0 || date.getMinutes() !== 0
      ? `Today ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : 'Today'
  }
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return date.getHours() !== 0 || date.getMinutes() !== 0
      ? `Tomorrow ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : 'Tomorrow'
  }
  
  // Within this week - show day name
  const daysUntil = Math.floor((dateOnly.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (daysUntil > 0 && daysUntil < 7) {
    const dayName = date.toLocaleDateString([], { weekday: 'short' })
    return date.getHours() !== 0 || date.getMinutes() !== 0
      ? `${dayName} ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : dayName
  }
  
  // Otherwise show date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

interface Task {
  id: string
  title: string
  project_id?: string
  project_name?: string
  completed: boolean
  estimated_pomodoros: number
  actual_pomodoros: number
  due_date?: string
  sort_order?: number
}

export default function TaskList() {
  const { 
    tasks, 
    projects,
    activeTask, 
    setActiveTask, 
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    addProject,
    updateProject,
    deleteProjectWithTasks,
  } = useTaskContext()
  const { settings, updateSettings } = useSettings()
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  
  const [newTask, setNewTask] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('')  // Used for both filter AND new task assignment
  const [showProjectInput, setShowProjectInput] = useState(false)
  
  // Active (non-completed) projects for add/edit dropdowns
  const activeProjects = projects.filter(p => !p.completed)
  const [newProjectName, setNewProjectName] = useState('')
  const [showManageProjects, setShowManageProjects] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; color: string; due_date?: string } | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null)

  const handleAddTask = () => {
    if (!newTask.trim()) return
    // 'none' or '' means no project assignment
    // Don't assign to completed projects
    const selectedIsActive = activeProjects.some(p => p.id === selectedProject)
    const projectId = (selectedProject && selectedProject !== 'none' && selectedIsActive) ? selectedProject : undefined
    addTask(newTask.trim(), projectId, 1)
    setNewTask('')
  }

  const handleAddProject = () => {
    if (!newProjectName.trim()) return
    addProject(newProjectName.trim())
    setNewProjectName('')
    setShowProjectInput(false)
  }

  const toggleComplete = (task: Task) => {
    updateTask(task.id, { completed: !task.completed })
  }

  const selectTask = (task: Task) => {
    if (task.completed) return
    setActiveTask(activeTask?.id === task.id ? null : task)
  }

  const handleDeleteProject = (id: string) => {
    deleteProjectWithTasks(id)
    setProjectToDelete(null)
    if (selectedProject === id) setSelectedProject('')
  }

  const incompleteTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)
  
  // Sort incomplete tasks by due date, and use sortOrder for undated tasks
  const sortedIncompleteTasks = [...incompleteTasks].sort((a, b) => {
    const aHasDue = !!a.due_date
    const bHasDue = !!b.due_date
    
    // If both have due dates, sort by date (soonest first)
    if (aHasDue && bHasDue) {
      return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
    }
    
    // If only one has a due date, use the setting to determine order
    if (aHasDue !== bHasDue) {
      if (settings.dated_tasks_first) {
        return aHasDue ? -1 : 1  // Dated tasks first
      } else {
        return aHasDue ? 1 : -1  // Undated tasks first
      }
    }
    
    // Both undated - sort by sortOrder (manual reorder)
    const aOrder = a.sort_order ?? Infinity
    const bOrder = b.sort_order ?? Infinity
    return aOrder - bOrder
  })
  
  const sortedTasks = settings.move_completed_to_bottom
    ? [...sortedIncompleteTasks, ...completedTasks]
    : sortedIncompleteTasks
  
  // Handle drag and drop for undated tasks
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault()
    if (!draggedTaskId || draggedTaskId === taskId) return
    
    // Only allow reordering undated tasks
    const draggedTask = tasks.find(t => t.id === draggedTaskId)
    const targetTask = tasks.find(t => t.id === taskId)
    if (draggedTask?.due_date || targetTask?.due_date) return
    
    e.dataTransfer.dropEffect = 'move'
  }
  
  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault()
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null)
      return
    }
    
    // Get current undated task order
    const undatedTasks = sortedIncompleteTasks.filter(t => !t.due_date && !t.completed)
    const draggedIndex = undatedTasks.findIndex(t => t.id === draggedTaskId)
    const targetIndex = undatedTasks.findIndex(t => t.id === targetTaskId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTaskId(null)
      return
    }
    
    // Reorder
    const newOrder = [...undatedTasks]
    const [removed] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, removed)
    
    // Update sort order
    reorderTasks(newOrder.map(t => t.id))
    setDraggedTaskId(null)
  }
  
  const handleDragEnd = () => {
    setDraggedTaskId(null)
  }

  // Filter tasks: '' = all, 'none' = no project, otherwise by project ID
  const filteredTasks = sortedTasks.filter(t => {
    if (selectedProject === '') return true  // All projects
    if (selectedProject === 'none') return !t.project_id  // No project
    return t.project_id === selectedProject  // Specific project
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Tasks</h2>
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="text-sm px-2 py-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
              title="Filter tasks & assign new tasks to project"
            >
              <option value="">All Tasks</option>
              <option value="none">No Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowManageProjects(true)}
            className="text-sm px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-red-500 border border-gray-200 dark:border-gray-600 rounded-lg"
          >
            ⚙️ Projects
          </button>
        </div>
      </div>

      {/* Add task input */}
      <div className="flex gap-2 mb-4">
        <input
          id="new-task-input"
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          placeholder={
            selectedProject && selectedProject !== 'none' 
              ? `Add task to ${projects.find(p => p.id === selectedProject)?.name}...` 
              : "Add a task..."
          }
          className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          onClick={handleAddTask}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Tasks list */}
      <ul className="space-y-2">
        {filteredTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isActive={activeTask?.id === task.id}
            isDragging={draggedTaskId === task.id}
            isDraggable={!task.due_date && !task.completed}
            onSelect={() => selectTask(task)}
            onToggle={() => toggleComplete(task)}
            onEdit={() => setEditingTask(task)}
            onDelete={() => deleteTask(task.id)}
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragOver={(e) => handleDragOver(e, task.id)}
            onDrop={(e) => handleDrop(e, task.id)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </ul>

      {filteredTasks.length === 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500 py-6">
          No tasks yet. Add one to get started!
        </p>
      )}

      {/* Completed tasks - separate section when move_completed_to_bottom is OFF */}
      {!settings.move_completed_to_bottom && completedTasks.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Completed ({completedTasks.length})
          </h3>
          <ul className="space-y-2">
            {completedTasks.slice(0, 5).map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isActive={false}
                isDragging={false}
                isDraggable={false}
                onSelect={() => {}}
                onToggle={() => toggleComplete(task)}
                onEdit={() => setEditingTask(task)}
                onDelete={() => deleteTask(task.id)}
                onDragStart={() => {}}
                onDragOver={() => {}}
                onDrop={() => {}}
                onDragEnd={() => {}}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Manage Projects Modal */}
      {showManageProjects && (
        <ManageProjectsModal
          projects={projects}
          onClose={() => setShowManageProjects(false)}
          onAddProject={handleAddProject}
          onEditProject={(p) => setEditingProject(p)}
          onDeleteProject={(id, name) => setProjectToDelete({ id, name })}
          onCompleteProject={(id) => updateProject(id, { completed: true, completedAt: new Date().toISOString() })}
          onUncompleteProject={(id) => updateProject(id, { completed: false, completedAt: undefined })}
          showProjectInput={showProjectInput}
          setShowProjectInput={setShowProjectInput}
          newProjectName={newProjectName}
          setNewProjectName={setNewProjectName}
          showCompleted={settings.show_completed_projects}
          onToggleShowCompleted={() => updateSettings({ show_completed_projects: !settings.show_completed_projects })}
        />
      )}

      {/* Delete Project Confirmation */}
      {projectToDelete && (
        <ConfirmDeleteModal
          title="Delete Project"
          message={`Are you sure you want to delete "${projectToDelete.name}"? All tasks in this project will also be deleted.`}
          onConfirm={() => handleDeleteProject(projectToDelete.id)}
          onCancel={() => setProjectToDelete(null)}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          projects={activeProjects}
          onSave={(updates) => {
            updateTask(editingTask.id, updates)
            setEditingTask(null)
          }}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onSave={(updates) => {
            updateProject(editingProject.id, updates)
            setEditingProject(null)
          }}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  )
}

function TaskItem({
  task,
  isActive,
  isDragging,
  isDraggable,
  onSelect,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  task: Task
  isActive: boolean
  isDragging: boolean
  isDraggable: boolean
  onSelect: () => void
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
}) {
  return (
    <li
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isDragging
          ? 'opacity-50 bg-gray-100 dark:bg-gray-600'
          : isActive
          ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500'
          : task.completed
          ? 'bg-gray-50 dark:bg-gray-700/50'
          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
      } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={onSelect}
    >
      {/* Drag handle for undated tasks */}
      {isDraggable && (
        <span className="text-gray-300 dark:text-gray-600 flex-shrink-0 cursor-grab" title="Drag to reorder">
          ⋮⋮
        </span>
      )}
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          task.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 dark:border-gray-500 hover:border-red-500'
        }`}
      >
        {task.completed && '✓'}
      </button>

      <div className="flex-1 min-w-0">
        <span
          className={`block truncate ${
            task.completed
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-800 dark:text-gray-200'
          }`}
        >
          {task.title || '(untitled)'}
        </span>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          {task.project_name && (
            <span>{task.project_name}</span>
          )}
          {task.due_date && (
            <span className={`flex items-center gap-0.5 ${
              !task.completed && new Date(task.due_date) < new Date() 
                ? 'text-red-500' 
                : ''
            }`}>
              📅 {formatDueDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      <span className={`text-sm flex-shrink-0 ${
        task.actual_pomodoros > task.estimated_pomodoros 
          ? 'text-orange-500' 
          : 'text-gray-400 dark:text-gray-500'
      }`}>
        🍅 {task.actual_pomodoros}/{task.estimated_pomodoros}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
        title="Edit task"
      >
        ✏️
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
        title="Delete task"
      >
        ✕
      </button>
    </li>
  )
}

function ManageProjectsModal({
  projects,
  onClose,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onCompleteProject,
  onUncompleteProject,
  showProjectInput,
  setShowProjectInput,
  newProjectName,
  setNewProjectName,
  showCompleted,
  onToggleShowCompleted,
}: {
  projects: { id: string; name: string; color: string; due_date?: string; completed?: boolean }[]
  onClose: () => void
  onAddProject: () => void
  onEditProject: (project: { id: string; name: string; color: string; due_date?: string }) => void
  onDeleteProject: (id: string, name: string) => void
  onCompleteProject: (id: string) => void
  onUncompleteProject: (id: string) => void
  showProjectInput: boolean
  setShowProjectInput: (v: boolean) => void
  newProjectName: string
  setNewProjectName: (v: string) => void
  showCompleted: boolean
  onToggleShowCompleted: () => void
}) {
  const activeProjects = projects.filter(p => !p.completed)
  const completedProjects = projects.filter(p => p.completed)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Manage Projects</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            ✕
          </button>
        </div>

        {/* Active Projects */}
        {activeProjects.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No active projects</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {activeProjects.map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || '#6B7280' }}
                  />
                  <div className="min-w-0">
                    <span className="text-gray-800 dark:text-gray-200 block truncate">{project.name}</span>
                    {project.due_date && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        📅 {formatDueDate(project.due_date)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onCompleteProject(project.id)}
                    className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                    title="Complete project"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => onEditProject(project)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit project"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDeleteProject(project.id, project.name)}
                    className="px-2 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!showProjectInput ? (
          <button
            onClick={() => setShowProjectInput(true)}
            className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors"
          >
            + Add Project
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddProject()}
              placeholder="Project name..."
              autoFocus
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={onAddProject}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowProjectInput(false)
                setNewProjectName('')
              }}
              className="px-3 py-2 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Completed Projects Section */}
        {completedProjects.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onToggleShowCompleted}
              className="flex items-center justify-between w-full text-left text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <span className="text-sm font-medium">
                Completed Projects ({completedProjects.length})
              </span>
              <span className="text-xs">{showCompleted ? '▼' : '▶'}</span>
            </button>
            
            {showCompleted && (
              <ul className="space-y-2 mt-3">
                {completedProjects.map((project) => (
                  <li
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg opacity-75"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color || '#6B7280' }}
                      />
                      <span className="text-gray-600 dark:text-gray-400 block truncate line-through">
                        {project.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onUncompleteProject(project.id)}
                        className="p-1.5 text-gray-400 hover:text-yellow-500 transition-colors"
                        title="Reopen project"
                      >
                        ↩️
                      </button>
                      <button
                        onClick={() => onDeleteProject(project.id, project.name)}
                        className="px-2 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}

function EditTaskModal({
  task,
  projects,
  onSave,
  onClose,
}: {
  task: Task
  projects: { id: string; name: string }[]
  onSave: (updates: Partial<Task>) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [projectId, setProjectId] = useState(task.project_id || '')
  const [estimate, setEstimate] = useState(task.estimated_pomodoros)
  // Separate date and optional time
  const [dueDate, setDueDate] = useState(() => {
    if (!task.due_date) return ''
    const d = new Date(task.due_date)
    return d.toISOString().slice(0, 10) // YYYY-MM-DD
  })
  const [dueTime, setDueTime] = useState(() => {
    if (!task.due_date) return ''
    const d = new Date(task.due_date)
    // Only show time if it's not midnight (meaning time was intentionally set)
    if (d.getHours() === 0 && d.getMinutes() === 0) return ''
    return d.toTimeString().slice(0, 5) // HH:MM
  })
  const [includeTime, setIncludeTime] = useState(() => {
    if (!task.due_date) return false
    const d = new Date(task.due_date)
    return !(d.getHours() === 0 && d.getMinutes() === 0)
  })

  const handleSave = () => {
    let dueDateISO: string | undefined
    if (dueDate) {
      if (includeTime && dueTime) {
        dueDateISO = new Date(`${dueDate}T${dueTime}`).toISOString()
      } else {
        // Date only - store as start of day in local timezone
        dueDateISO = new Date(`${dueDate}T00:00:00`).toISOString()
      }
    }
    onSave({
      title: title.trim() || task.title,
      project_id: projectId || undefined,
      estimated_pomodoros: estimate,
      due_date: dueDateISO,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => { setDueDate(''); setDueTime(''); setIncludeTime(false) }}
                  className="px-3 py-2 text-gray-500 hover:text-red-500 border border-gray-200 dark:border-gray-600 rounded-lg"
                  title="Clear due date"
                >
                  ✕
                </button>
              )}
            </div>
            {dueDate && (
              <div className="mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={includeTime}
                    onChange={(e) => {
                      setIncludeTime(e.target.checked)
                      if (!e.target.checked) setDueTime('')
                    }}
                    className="rounded"
                  />
                  Include time
                </label>
                {includeTime && (
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estimated Pomodoros
            </label>
            <input
              type="number"
              value={estimate}
              onChange={(e) => setEstimate(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function EditProjectModal({
  project,
  onSave,
  onClose,
}: {
  project: { id: string; name: string; color: string; due_date?: string }
  onSave: (updates: { name?: string; color?: string; due_date?: string }) => void
  onClose: () => void
}) {
  const [name, setName] = useState(project.name)
  const [color, setColor] = useState(project.color)
  const [dueDate, setDueDate] = useState(() => {
    if (!project.due_date) return ''
    const d = new Date(project.due_date)
    return d.toISOString().slice(0, 10) // YYYY-MM-DD
  })
  const [dueTime, setDueTime] = useState(() => {
    if (!project.due_date) return ''
    const d = new Date(project.due_date)
    if (d.getHours() === 0 && d.getMinutes() === 0) return ''
    return d.toTimeString().slice(0, 5)
  })
  const [includeTime, setIncludeTime] = useState(() => {
    if (!project.due_date) return false
    const d = new Date(project.due_date)
    return !(d.getHours() === 0 && d.getMinutes() === 0)
  })

  const handleSave = () => {
    let dueDateISO: string | undefined
    if (dueDate) {
      if (includeTime && dueTime) {
        dueDateISO = new Date(`${dueDate}T${dueTime}`).toISOString()
      } else {
        dueDateISO = new Date(`${dueDate}T00:00:00`).toISOString()
      }
    }
    onSave({
      name: name.trim() || project.name,
      color,
      due_date: dueDateISO,
    })
  }

  const colorOptions = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => { setDueDate(''); setDueTime(''); setIncludeTime(false) }}
                  className="px-3 py-2 text-gray-500 hover:text-red-500 border border-gray-200 dark:border-gray-600 rounded-lg"
                  title="Clear due date"
                >
                  ✕
                </button>
              )}
            </div>
            {dueDate && (
              <div className="mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={includeTime}
                    onChange={(e) => {
                      setIncludeTime(e.target.checked)
                      if (!e.target.checked) setDueTime('')
                    }}
                    className="rounded"
                  />
                  Include time
                </label>
                {includeTime && (
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
