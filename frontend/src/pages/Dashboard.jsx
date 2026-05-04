import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Clock, CheckCircle2, AlertCircle, LayoutDashboard } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = [useState([]), useState([])][0]; // To be replaced with proper state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // We fetch tasks, and projects can be fetched similarly
        const taskRes = await fetch('/api/tasks', { headers });
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setTasks(taskData);
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
      const res = await fetch(`/api/tasks/${taskId}`, {
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

  if (loading) return <div className="text-center mt-4">Loading dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user.name}!</p>
        </div>
        {user.role === 'ADMIN' && (
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={() => alert('Project creation to be implemented')}>
              <PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> New Project
            </button>
            <button className="btn btn-secondary" onClick={() => alert('Task creation to be implemented')}>
              <PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> New Task
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Task List Section */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <CheckCircle2 size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} /> 
            {user.role === 'ADMIN' ? 'All Tasks' : 'My Tasks'}
          </h2>
          
          {tasks.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No tasks found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tasks.map(task => (
                <div key={task.id} style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 style={{ fontWeight: '600', fontSize: '1rem' }}>{task.title}</h3>
                    {getStatusBadge(task.status)}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Project: {task.project?.name} | Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {user.role === 'ADMIN' && `Assignee: ${task.assignedTo?.name || 'Unassigned'}`}
                    </div>
                    
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Summary Section */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <LayoutDashboard size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} /> 
            My Projects
          </h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
            Project view is active. Connect to database to see live projects.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
