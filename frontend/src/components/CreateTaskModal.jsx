import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated, currentProjects }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  
  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (currentProjects && currentProjects.length > 0) {
        setProjects(currentProjects);
        setProjectId(currentProjects[0].id);
      } else {
        // Fetch projects if not provided
        const fetchProjects = async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://adorable-caring-production-3038.up.railway.app/api/projects', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              setProjects(data);
              if (data.length > 0) setProjectId(data[0].id);
            }
          } catch (err) {
            console.error('Failed to fetch projects', err);
          }
        };
        fetchProjects();
      }
    }
  }, [isOpen, currentProjects]);

  // Update members list when project changes
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const selected = projects.find(p => p.id === projectId);
      if (selected && selected.members) {
        setProjectMembers(selected.members);
        if (selected.members.length > 0) {
          setAssignedToId(selected.members[0].id);
        } else {
          setAssignedToId('');
        }
      } else {
        setProjectMembers([]);
        setAssignedToId('');
      }
    }
  }, [projectId, projects]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!projectId) {
      setError('Please select a project first.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://adorable-caring-production-3038.up.railway.app/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title, 
          description, 
          status, 
          dueDate: dueDate || null, 
          projectId, 
          assignedToId: assignedToId || null 
        })
      });

      const data = await res.json();

      if (res.ok) {
        setTitle('');
        setDescription('');
        setStatus('TODO');
        setDueDate('');
        onTaskCreated(data);
        onClose();
      } else {
        setError(data.message || 'Failed to create task');
      }
    } catch (err) {
      setError('An error occurred while creating the task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Create New Task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-4">
            <p style={{ color: 'var(--warning)', marginBottom: '1rem' }}>You need to create a project before adding tasks.</p>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="project">Project</label>
              <select
                id="project"
                className="input-field"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="title">Task Title</label>
              <input
                type="text"
                id="title"
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="E.g., Design Homepage"
              />
            </div>

            <div className="input-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="input-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="2"
                placeholder="Details about the task..."
              ></textarea>
            </div>

            <div className="flex gap-4">
              <div className="input-group" style={{ flex: 1 }}>
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  className="input-field"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <label htmlFor="dueDate">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  className="input-field"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="assignee">Assign To</label>
              <select
                id="assignee"
                className="input-field"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {projectMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {projectMembers.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>This project has no members to assign.</p>}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateTaskModal;
