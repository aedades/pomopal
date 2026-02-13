import { useState } from 'react'
import { useTaskContext } from '../context/TaskContext'
import { useSettings } from '../hooks/useSettings'

interface Task {
  id: string
  title: string
  project_id?: string
  project_name?: string
  completed: boolean
  estimated_pomodoros: number
  actual_pomodoros: number
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
    addProject,
    deleteProjectWithTasks,
  } = useTaskContext()
  const { settings } = useSettings()
  
  const [newTask, setNewTask] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('')  // Used for both filter AND new task assignment
  const [showProjectInput, setShowProjectInput] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [showManageProjects, setShowManageProjects] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null)

  const handleAddTask = () => {
    if (!newTask.trim()) return
    // 'none' or '' means no project assignment
    const projectId = (selectedProject && selectedProject !== 'none') ? selectedProject : undefined
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
  
  const sortedTasks = settings.move_completed_to_bottom
    ? [...incompleteTasks, ...completedTasks]
    : incompleteTasks

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
            onSelect={() => selectTask(task)}
            onToggle={() => toggleComplete(task)}
            onEdit={() => setEditingTask(task)}
            onDelete={() => deleteTask(task.id)}
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
                onSelect={() => {}}
                onToggle={() => toggleComplete(task)}
                onEdit={() => setEditingTask(task)}
                onDelete={() => deleteTask(task.id)}
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
          onDeleteProject={(id, name) => setProjectToDelete({ id, name })}
          showProjectInput={showProjectInput}
          setShowProjectInput={setShowProjectInput}
          newProjectName={newProjectName}
          setNewProjectName={setNewProjectName}
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
          projects={projects}
          onSave={(updates) => {
            updateTask(editingTask.id, updates)
            setEditingTask(null)
          }}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}

function TaskItem({
  task,
  isActive,
  onSelect,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task
  isActive: boolean
  onSelect: () => void
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <li
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500'
          : task.completed
          ? 'bg-gray-50 dark:bg-gray-700/50'
          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
      }`}
      onClick={onSelect}
    >
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
        {task.project_name && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {task.project_name}
          </span>
        )}
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
  onDeleteProject,
  showProjectInput,
  setShowProjectInput,
  newProjectName,
  setNewProjectName,
}: {
  projects: { id: string; name: string; color: string }[]
  onClose: () => void
  onAddProject: () => void
  onDeleteProject: (id: string, name: string) => void
  showProjectInput: boolean
  setShowProjectInput: (v: boolean) => void
  newProjectName: string
  setNewProjectName: (v: string) => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Manage Projects</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            ✕
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No projects yet</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color || '#6B7280' }}
                  />
                  <span className="text-gray-800 dark:text-gray-200">{project.name}</span>
                </div>
                <button
                  onClick={() => onDeleteProject(project.id, project.name)}
                  className="px-3 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  Delete
                </button>
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

  const handleSave = () => {
    onSave({
      title: title.trim() || task.title,
      project_id: projectId || undefined,
      estimated_pomodoros: estimate,
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
