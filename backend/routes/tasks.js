const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get Tasks (Admin sees all for their projects, Member sees assigned)
router.get('/', protect, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'ADMIN') {
      tasks = await prisma.task.findMany({
        where: { project: { createdById: req.user.userId } },
        include: { 
          project: { select: { name: true } },
          assignedTo: { select: { name: true } } 
        },
        orderBy: { dueDate: 'asc' }
      });
    } else {
      tasks = await prisma.task.findMany({
        where: { assignedToId: req.user.userId },
        include: { 
          project: { select: { name: true } },
        },
        orderBy: { dueDate: 'asc' }
      });
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Task (Admin Only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, description, status, dueDate, projectId, assignedToId } = req.body;
    
    // Check if project exists and admin owns it
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.createdById !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized for this project' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assignedToId
      },
      include: { assignedTo: { select: { name: true } } }
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Task Status (Admin or Assigned Member)
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, title, description, assignedToId, dueDate } = req.body;
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { project: true } });

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check permissions
    if (req.user.role !== 'ADMIN' && task.assignedToId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    
    // Admin can update other fields
    if (req.user.role === 'ADMIN') {
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (assignedToId) updateData.assignedToId = assignedToId;
      if (dueDate) updateData.dueDate = new Date(dueDate);
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: { assignedTo: { select: { name: true } } }
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Task (Admin Only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
