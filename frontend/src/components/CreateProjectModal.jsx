import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberIds, setMemberIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Fetch users when modal opens
      const fetchUsers = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // Filter out admins if you only want to assign members, but let's just show everyone
            setUsers(data);
          }
        } catch (err) {
          console.error('Failed to fetch users', err);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, memberIds })
      });

      const data = await res.json();

      if (res.ok) {
        setName('');
        setDescription('');
        setMemberIds([]);
        onProjectCreated(data);
        onClose();
      } else {
        setError(data.message || 'Failed to create project');
      }
    } catch (err) {
      setError('An error occurred while creating the project.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id) => {
    setMemberIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Create New Project</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name">Project Name</label>
            <input
              type="text"
              id="name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="E.g., Website Redesign"
            />
          </div>

          <div className="input-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              placeholder="Briefly describe the project..."
            ></textarea>
          </div>

          <div className="input-group">
            <label>Assign Members</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
              {users.map(user => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={memberIds.includes(user.id)}
                    onChange={() => toggleMember(user.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor={`user-${user.id}`} style={{ cursor: 'pointer', margin: 0, fontSize: '0.9rem' }}>
                    {user.name} <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>({user.email})</span>
                  </label>
                </div>
              ))}
              {users.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '0.5rem' }}>No users found.</p>}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
