import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Users, CheckCircle2, PlusCircle, LayoutDashboard } from 'lucide-react';
import CreateTaskModal from '../components/CreateTaskModal';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://adorable-caring-production-3038.up.railway.app/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        } else {
          setError('Failed to load project details.');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while fetching the project.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id]);

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://adorable-caring-production-3038.up.railway.app/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updatedTask = await res.json();
        // Update task locally
        setProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t)
        }));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskCreated = (newTask) => {
    setProject(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
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

  if (loading) return <div className="text-center mt-8">Loading project details...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;
  if (!project) return <div className="text-center mt-8">Project not found.</div>;

  return (
    <div className="animate-fade-in">
      <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} /> Back to Projects
      </Link>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{project.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{project.description || 'No description provided.'}</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setIsCreateTaskModalOpen(true)}>
            <PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> Add Task
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Tasks Section */}
        <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: 'span 2' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <CheckCircle2 size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
            Project Tasks
          </h2>

          {(!project.tasks || project.tasks.length === 0) ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No tasks assigned to this project yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {project.tasks.map(task => (
                <div key={task.id} style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 style={{ fontWeight: '600', fontSize: '1rem' }}>{task.title}</h3>
                    {getStatusBadge(task.status)}
                  </div>
                  {task.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {task.description}
                    </p>
                  )}
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}
                  </p>

                  <div className="flex justify-between items-center">
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Assignee: <span style={{ color: 'var(--text-primary)' }}>{task.assignedTo?.name || 'Unassigned'}</span>
                    </div>

                    {(user?.role === 'ADMIN' || task.assignedToId === user?.id) && (
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

        {/* Members Section */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <Users size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
            Team Members
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {project.members && project.members.map(member => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '0.75rem', fontSize: '0.875rem' }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: '500', fontSize: '0.875rem', margin: 0 }}>{member.name}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>{member.email}</p>
                </div>
              </div>
            ))}
            {(!project.members || project.members.length === 0) && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No members assigned.</p>
            )}
          </div>
        </div>
      </div>

      <CreateTaskModal 
        isOpen={isCreateTaskModalOpen} 
        onClose={() => setIsCreateTaskModalOpen(false)} 
        onTaskCreated={handleTaskCreated}
        currentProjects={[project]}
      />
    </div>
  );
};

export default ProjectDetails;
