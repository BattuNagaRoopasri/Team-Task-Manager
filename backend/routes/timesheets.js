const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get Time Logs for a Project
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: { members: true },
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Access check: Only Admin or Project Members
    if (req.user.role !== 'ADMIN' && !project.members.some(m => m.id === req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const timeLogs = await prisma.timeLog.findMany({
      where: { projectId: req.params.projectId },
      include: { user: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    res.json(timeLogs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Log Hours
router.post('/', protect, async (req, res) => {
  try {
    const { hours, date, isBillable, description, projectId } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Access check
    if (req.user.role !== 'ADMIN' && !project.members.some(m => m.id === req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to log hours for this project' });
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        hours: parseFloat(hours),
        date: new Date(date),
        isBillable: Boolean(isBillable),
        description,
        projectId,
        userId: req.user.userId,
      },
      include: { user: { select: { name: true } } }
    });

    res.status(201).json(timeLog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Status (Admin Only) - Approve / Reject
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body; // PENDING, APPROVED, REJECTED
    
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    const timeLog = await prisma.timeLog.update({
      where: { id: req.params.id },
      data: { status },
      include: { user: { select: { name: true } } }
    });

    res.json(timeLog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
