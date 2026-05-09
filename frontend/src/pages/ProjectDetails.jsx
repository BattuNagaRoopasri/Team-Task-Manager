import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Users, CheckCircle2, PlusCircle, LayoutDashboard, MessageSquare, Send, Clock, FileText, Check, X } from 'lucide-react';
import CreateTaskModal from '../components/CreateTaskModal';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [activeTab, setActiveTab] = useState('tasks');
  const [timeLogs, setTimeLogs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [newTimeLog, setNewTimeLog] = useState({ hours: '', date: new Date().toISOString().split('T')[0], description: '' });

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const res = await fetch(`https://adorable-caring-production-3038.up.railway.app/api/projects/${id}`, { headers });
        
        if (res.ok) {
          const data = await res.json();
          setProject(data);
          
          // Fetch messages
          try {
            const msgRes = await fetch(`https://adorable-caring-production-3038.up.railway.app/api/projects/${id}/messages`, { headers });
            if (msgRes.ok) setMessages(await msgRes.json());
          } catch (e) {}

          // Fetch timesheets
          try {
            const timeRes = await fetch(`https://adorable-caring-production-3038.up.railway.app/api/timesheets/project/${id}`, { headers });
            if (timeRes.ok) setTimeLogs(await timeRes.json());
          } catch (e) {}

          // Fetch invoices
          try {
            const invRes = await fetch(`https://adorable-caring-production-3038.up.railway.app/api/invoices/project/${id}`, { headers });
            if (invRes.ok) setInvoices(await invRes.json());
          } catch (e) {}

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updatedTask = await res.json();
        setProject(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t) }));
      }
    } catch (error) { console.error(error); }
  };

  const handleTaskCreated = (newTask) => {
    setProject(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://adorable-caring-production-3038.up.railway.app/api/projects/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newMessage })
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages([...messages, msg]);
        setNewMessage('');
      }
    } catch (error) { console.error(error); }
  };

  const handleLogTime = async (e) => {
    e.preventDefault();
    if (!newTimeLog.hours || !newTimeLog.date) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://adorable-caring-production-3038.up.railway.app/api/timesheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newTimeLog, isBillable: true, projectId: id })
      });
      if (res.ok) {
        const log = await res.json();
        setTimeLogs([log, ...timeLogs]);
        setNewTimeLog({ hours: '', date: new Date().toISOString().split('T')[0], description: '' });
      }
    } catch (error) { console.error(error); }
  };

  const handleApproveTime = async (logId, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://adorable-caring-production-3038.up.railway.app/api/timesheets/${logId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updatedLog = await res.json();
        setTimeLogs(timeLogs.map(l => l.id === logId ? updatedLog : l));
      }
    } catch (error) { console.error(error); }
  };

  const handleGenerateInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://adorable-caring-production-3038.up.railway.app/api/invoices/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId: id, hourlyRate: 50 }) // Fixed rate for now
      });
      if (res.ok) {
        const newInvoice = await res.json();
        setInvoices([newInvoice, ...invoices]);
        // Update local time logs to show they are now invoiced
        setTimeLogs(timeLogs.map(l => (l.status === 'APPROVED' && !l.invoiceId) ? { ...l, invoiceId: newInvoice.id } : l));
        alert('Invoice generated successfully!');
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) { console.error(error); }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'TODO': return <span className="badge badge-todo">To Do</span>;
      case 'IN_PROGRESS': return <span className="badge badge-in-progress">In Progress</span>;
      case 'DONE': return <span className="badge badge-done">Done</span>;
      case 'OVERDUE': return <span className="badge badge-overdue">Overdue</span>;
      case 'PENDING': return <span className="badge badge-overdue">Pending</span>;
      case 'APPROVED': return <span className="badge badge-done">Approved</span>;
      case 'REJECTED': return <span className="badge badge-todo">Rejected</span>;
      case 'DRAFT': return <span className="badge badge-todo">Draft</span>;
      case 'SENT': return <span className="badge badge-in-progress">Sent</span>;
      case 'PAID': return <span className="badge badge-done">Paid</span>;
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

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{project.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{project.description || 'No description provided.'}</p>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveTab('tasks')} style={{ padding: '0.75rem 1rem', borderBottom: activeTab === 'tasks' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'tasks' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: '600', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>Tasks</button>
        <button onClick={() => setActiveTab('timesheets')} style={{ padding: '0.75rem 1rem', borderBottom: activeTab === 'timesheets' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'timesheets' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: '600', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>Timesheets</button>
        <button onClick={() => setActiveTab('invoices')} style={{ padding: '0.75rem 1rem', borderBottom: activeTab === 'invoices' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'invoices' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: '600', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>NexusWave Invoices</button>
        <button onClick={() => setActiveTab('discussion')} style={{ padding: '0.75rem 1rem', borderBottom: activeTab === 'discussion' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'discussion' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: '600', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>Discussion</button>
      </div>

      {activeTab === 'tasks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: 'span 2' }}>
            <div className="flex justify-between items-center mb-4">
               <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                 <CheckCircle2 size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
                 Project Tasks
               </h2>
               {user?.role === 'ADMIN' && (
                 <button className="btn btn-primary" onClick={() => setIsCreateTaskModalOpen(true)}>
                   <PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> Add Task
                 </button>
               )}
            </div>

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
                    {task.description && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{task.description}</p>}
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}</p>
                    <div className="flex justify-between items-center">
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Assignee: <span style={{ color: 'var(--text-primary)' }}>{task.assignedTo?.name || 'Unassigned'}</span></div>
                      {(user?.role === 'ADMIN' || task.assignedToId === user?.id) && (
                        <select className="input-field" style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} value={task.status} onChange={(e) => handleStatusUpdate(task.id, e.target.value)}>
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
          <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
              <Users size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} /> Team Members
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {project.members && project.members.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '0.75rem', fontSize: '0.875rem' }}>{member.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <p style={{ fontWeight: '500', fontSize: '0.875rem', margin: 0 }}>{member.name}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timesheets' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
           <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
              <Clock size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
              Log Your Hours
           </h2>
           <form onSubmit={handleLogTime} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', alignItems: 'end' }}>
             <div>
               <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Date</label>
               <input type="date" className="input-field" value={newTimeLog.date} onChange={e => setNewTimeLog({...newTimeLog, date: e.target.value})} required />
             </div>
             <div>
               <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Hours</label>
               <input type="number" step="0.5" className="input-field" placeholder="e.g. 2.5" value={newTimeLog.hours} onChange={e => setNewTimeLog({...newTimeLog, hours: e.target.value})} required />
             </div>
             <div style={{ gridColumn: 'span 2' }}>
               <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Description</label>
               <input type="text" className="input-field" placeholder="What did you work on?" value={newTimeLog.description} onChange={e => setNewTimeLog({...newTimeLog, description: e.target.value})} />
             </div>
             <button type="submit" className="btn btn-primary">Log Time</button>
           </form>

           <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Timesheet Entries</h3>
           {timeLogs.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No time logged yet.</p> : (
             <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                 <thead>
                   <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                     <th style={{ padding: '0.75rem 0' }}>Date</th>
                     <th style={{ padding: '0.75rem 0' }}>User</th>
                     <th style={{ padding: '0.75rem 0' }}>Hours</th>
                     <th style={{ padding: '0.75rem 0' }}>Description</th>
                     <th style={{ padding: '0.75rem 0' }}>Status</th>
                     {user?.role === 'ADMIN' && <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Actions</th>}
                   </tr>
                 </thead>
                 <tbody>
                   {timeLogs.map(log => (
                     <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                       <td style={{ padding: '0.75rem 0', fontSize: '0.875rem' }}>{new Date(log.date).toLocaleDateString()}</td>
                       <td style={{ padding: '0.75rem 0', fontSize: '0.875rem' }}>{log.user?.name}</td>
                       <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', fontWeight: 'bold' }}>{log.hours}</td>
                       <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{log.description}</td>
                       <td style={{ padding: '0.75rem 0' }}>{getStatusBadge(log.status)}</td>
                       {user?.role === 'ADMIN' && (
                         <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                           {log.status === 'PENDING' && (
                             <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                               <button onClick={() => handleApproveTime(log.id, 'APPROVED')} style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: 'none', padding: '0.25rem', borderRadius: '0.25rem', cursor: 'pointer' }}><Check size={16} /></button>
                               <button onClick={() => handleApproveTime(log.id, 'REJECTED')} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', padding: '0.25rem', borderRadius: '0.25rem', cursor: 'pointer' }}><X size={16} /></button>
                             </div>
                           )}
                         </td>
                       )}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
           <div className="flex justify-between items-center mb-6">
             <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                <FileText size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
                NexusWave Invoices
             </h2>
             {user?.role === 'ADMIN' && (
               <button className="btn btn-primary" onClick={handleGenerateInvoice}>
                 Generate Invoice
               </button>
             )}
           </div>

           {invoices.length === 0 ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No invoices generated yet.</p> : (
             <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
               {invoices.map(inv => (
                 <div key={inv.id} style={{ padding: '1.5rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {inv.id.substring(0, 8)}</span>
                     {getStatusBadge(inv.status)}
                   </div>
                   <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>${inv.amount.toFixed(2)}</h3>
                   <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Generated: {new Date(inv.createdAt).toLocaleDateString()}</span>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {activeTab === 'discussion' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <MessageSquare size={20} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
            Project Discussion
          </h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.2)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            {messages.length === 0 ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 'auto' }}>No messages yet.</p> : (
              messages.map(msg => (
                <div key={msg.id} style={{ alignSelf: msg.senderId === user?.id ? 'flex-end' : 'flex-start', maxWidth: '80%', backgroundColor: msg.senderId === user?.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.8)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid ' + (msg.senderId === user?.id ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-color)') }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', gap: '1rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{msg.sender?.name} {msg.sender?.role === 'ADMIN' ? '(Admin)' : ''}</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{msg.content}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" className="input-field" placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}><Send size={18} /></button>
          </form>
        </div>
      )}

      <CreateTaskModal isOpen={isCreateTaskModalOpen} onClose={() => setIsCreateTaskModalOpen(false)} onTaskCreated={handleTaskCreated} currentProjects={[project]} />
    </div>
  );
};

export default ProjectDetails;
