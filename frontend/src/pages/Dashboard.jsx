import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, CheckCircle2, LayoutDashboard, Users, Calendar } from 'lucide-react';
import CreateProjectModal from '../components/CreateProjectModal';
import CreateTaskModal from '../components/CreateTaskModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Tasks
        const taskRes = await fetch('http://localhost:5000/api/tasks', { headers });
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setTasks(taskData);
        }

        // Fetch Projects
        const projRes = await fetch('http://localhost:5000/api/projects', { headers });
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'TODO': return <span className="badge badge-todo">To Do</span>;
      case 'IN_PROGRESS': return <span className="badge badge-in-progress">In Progress</span>;
      case 'DONE': return <span className="badge badge-done">Done</span>;
      case 'OVERDUE': return <span className="badge badge-overdue">Overdue</span>;
      default: return null;
    }
  };

  if (loading) return <div className="text-center mt-8">Loading dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user.name}!</p>
        </div>
        {user.role === 'ADMIN' && (
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={() => setIsProjectModalOpen(true)}>
              <PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> New Project
            </button>
            <button className="btn btn-secondary" onClick={() => setIsTaskModalOpen(true)}>
              <PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> New Task
            </button>
          </div>
        )}
      </div>

      {/* Overview Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <LayoutDashboard size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Projects</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{projects.length}</h3>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Tasks</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{tasks.length}</h3>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Completed Tasks</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{tasks.filter(t => t.status === 'DONE').length}</h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Task List Section */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
              <CheckCircle2 size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
              {user.role === 'ADMIN' ? 'Active Tasks' : 'My Active Tasks'}
            </h2>

            {tasks.filter(t => t.status !== 'DONE').length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>No active tasks found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.filter(t => t.status !== 'DONE').map(task => (
                  <div key={task.id} style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 style={{ fontWeight: '600', fontSize: '1rem' }}>{task.title}</h3>
                      {getStatusBadge(task.status)}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Project: <span style={{ color: 'var(--text-primary)' }}>{task.project?.name}</span> | Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}
                    </p>

                    <div className="flex justify-between items-center">
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {user.role === 'ADMIN' && `Assignee: ${task.assignedTo?.name || 'Unassigned'}`}
                      </div>

                      {(user.role === 'ADMIN' || task.assignedToId === user.id) && (
                        <select
                          className="input-field"
                          style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          value={task.status}
                          onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
              <CheckCircle2 size={20} style={{ marginRight: '0.5rem', color: '#22c55e' }} />
              Completed Tasks
            </h2>

            {tasks.filter(t => t.status === 'DONE').length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>No completed tasks.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.filter(t => t.status === 'DONE').map(task => (
                  <div key={task.id} style={{ padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 style={{ fontWeight: '600', fontSize: '1rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>{task.title}</h3>
                      {getStatusBadge(task.status)}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Project: <span style={{ color: 'var(--text-primary)' }}>{task.project?.name}</span>
                    </p>

                    <div className="flex justify-between items-center">
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {user.role === 'ADMIN' && `Assignee: ${task.assignedTo?.name || 'Unassigned'}`}
                      </div>

                      {(user.role === 'ADMIN' || task.assignedToId === user.id) && (
                        <select
                          className="input-field"
                          style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          value={task.status}
                          onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Project Summary Section */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
              <LayoutDashboard size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
              My Projects
            </h2>
            <Link to="/projects" style={{ fontSize: '0.875rem', fontWeight: '500' }}>View All</Link>
          </div>

          {projects.length === 0 ? (
             <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No projects found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {projects.slice(0, 5).map(project => (
                <Link to={`/projects/${project.id}`} key={project.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', textDecoration: 'none', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.4)'}>
                  <div>
                    <h3 style={{ fontWeight: '500', fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{project.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={12} /> {project.members?.length || 0}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} /> {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        onProjectCreated={(newProj) => setProjects([...projects, newProj])}
      />
      <CreateTaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        onTaskCreated={(newTask) => setTasks([...tasks, newTask])}
        currentProjects={projects}
      />
    </div>
  );
};

export default Dashboard;
