import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, CheckCircle2, LayoutDashboard } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]); // ✅ fixed
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await fetch(`${API}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${API}/api/tasks/${taskId}`, {
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
      console.error('Error updating task:', error);
    }
  };

  if (loading) return <div className="text-center mt-4">Loading...</div>;

  return (
    <div className="animate-fade-in">
      <h1>Welcome {user?.name}</h1>

      {tasks.length === 0 ? (
        <p>No tasks found</p>
      ) : (
        tasks.map(task => (
          <div key={task.id}>
            <h3>{task.title}</h3>
            <p>Status: {task.status}</p>

            <select
              value={task.status}
              onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
            >
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>
        ))
      )}
    </div>
  );
};

export default Dashboard;