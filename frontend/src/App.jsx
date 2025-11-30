import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Circle, Trash2, Edit2, Plus, LogOut, User, 
  Layout, Calendar, AlertCircle, X 
} from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [tasks, setTasks] = useState([]);
  
  // State baru untuk Edit
  const [editingTask, setEditingTask] = useState(null); 
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
      fetchTasks();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Registration successful! Please login.');
        setShowLogin(true);
        setRegisterData({ name: '', email: '', password: '' });
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        setLoginData({ email: '', password: '' });
        fetchTasks();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setTasks([]);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskForm)
      });
      if (res.ok) {
        setTaskForm({ title: '', description: '', priority: 'medium' });
        fetchTasks();
        setSuccess('Task created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create task');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  // --- Fungsi Update Task (PATCH) ---
  const handleUpdateTask = async (id, updates) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchTasks();
        if (updates.title) { // Jika ini update dari form edit (bukan cuma centang complete)
             setEditingTask(null);
             setSuccess('Task updated successfully!');
             setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTasks();
        setSuccess('Task deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  // --- Auth Screen UI (Tetap Sama) ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="absolute inset-0 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>
        
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 mb-4">
              <Layout size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-500 mt-2">Manage your tasks with efficiency</p>
          </div>

          {(error || success) && (
            <div className={`mb-6 p-4 rounded-lg text-sm flex items-center gap-2 ${
              error ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
            }`}>
              <AlertCircle size={16} />
              {error || success}
            </div>
          )}

          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => setShowLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                showLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                !showLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={showLogin ? handleLogin : handleRegister} className="space-y-4">
            {!showLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={showLogin ? loginData.email : registerData.email}
                onChange={(e) => showLogin 
                  ? setLoginData({...loginData, email: e.target.value})
                  : setRegisterData({...registerData, email: e.target.value})
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={showLogin ? loginData.password : registerData.password}
                onChange={(e) => showLogin 
                  ? setLoginData({...loginData, password: e.target.value})
                  : setRegisterData({...registerData, password: e.target.value})
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200"
            >
              {showLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main App UI ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Layout size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">TaskFlow</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {currentUser?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{currentUser?.name}</span>
                  <span className="text-xs text-gray-500">Free Plan</span>
                </div>
              </div>
              <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {(error || success) && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
            error ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}>
            <AlertCircle size={20} />
            <span className="font-medium">{error || success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Create Task */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Plus size={20} className="text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">New Task</h2>
              </div>
              
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="e.g. Review Q3 Report"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTaskForm({...taskForm, priority: p})}
                        className={`px-2 py-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                          taskForm.priority === p
                            ? p === 'high' ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-500'
                            : p === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-700 ring-1 ring-amber-500'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-1 ring-emerald-500'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm min-h-[100px] resize-none"
                    placeholder="Add details..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-black transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Add Task
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Task List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">My Tasks</h2>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                {tasks.length} items
              </span>
            </div>

            {/* --- FORM EDIT (Hanya Muncul saat editingTask != null) --- */}
            {editingTask && (
              <div className="bg-white rounded-2xl shadow-md border border-indigo-200 p-6 mb-4 animate-fade-in relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                        <Edit2 size={18} /> Edit Task
                    </h3>
                    <button onClick={() => setEditingTask(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                 </div>
                 
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateTask(editingTask.id, {
                        title: editingTask.title,
                        description: editingTask.description,
                        priority: editingTask.priority
                    });
                 }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Title</label>
                            <input
                                type="text"
                                value={editingTask.title}
                                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Priority</label>
                            <select
                                value={editingTask.priority}
                                onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                        <textarea
                            value={editingTask.description}
                            onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                            rows="2"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Save Changes</button>
                    </div>
                 </form>
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Calendar size={32} />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No tasks found</h3>
                <p className="text-gray-500 text-sm">Get started by creating your first task.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group bg-white rounded-xl border p-4 transition-all duration-200 ${
                        // Highlight task yang sedang diedit
                        editingTask?.id === task.id ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-gray-200 hover:shadow-md hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleUpdateTask(task.id, { completed: !task.completed })}
                        className={`mt-1 flex-shrink-0 transition-colors ${
                          task.completed ? 'text-emerald-500' : 'text-gray-300 hover:text-indigo-500'
                        }`}
                      >
                        {task.completed ? <CheckCircle size={22} className="fill-emerald-50" /> : <Circle size={22} />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={`font-medium truncate ${
                            task.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </h3>
                          {/* INI STYLE BADGE LAMA YANG KAMU SUKA 👇 */}
                          <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                            task.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                            task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {/* TOMBOL EDIT BARU 👇 */}
                        <button
                            onClick={() => setEditingTask(task)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit task"
                        >
                            <Edit2 size={18} />
                        </button>

                        <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete task"
                        >
                            <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;