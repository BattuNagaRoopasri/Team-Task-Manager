const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get Projects (Admin sees all created, Member sees assigned)
router.get('/', protect, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'ADMIN') {
      projects = await prisma.project.findMany({
        where: { createdById: req.user.userId },
        include: { members: { select: { id: true, name: true } } },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          members: {
            some: { id: req.user.userId },
          },
        },
        include: { members: { select: { id: true, name: true } } },
      });
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Project (Admin Only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    
    // Convert memberIds to prisma connection format
    const membersData = memberIds ? memberIds.map(id => ({ id })) : [];

    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdById: req.user.userId,
        members: {
          connect: membersData,
        },
      },
      include: { members: { select: { id: true, name: true } } },
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Single Project
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { 
        members: { select: { id: true, name: true, email: true } },
        tasks: { include: { assignedTo: { select: { name: true } } } }
      },
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Access check
    if (req.user.role !== 'ADMIN' && !project.members.some(m => m.id === req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add Members to Project (Admin Only)
router.put('/:id/members', protect, admin, async (req, res) => {
  try {
    const { memberIds } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        members: {
          connect: memberIds.map(id => ({ id }))
        }
      },
      include: { members: { select: { id: true, name: true } } }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Messages for a Project
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Access check
    if (req.user.role !== 'ADMIN' && !project.members.some(m => m.id === req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await prisma.message.findMany({
      where: { projectId: req.params.id },
      include: { sender: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Post a Message to a Project
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Access check
    if (req.user.role !== 'ADMIN' && !project.members.some(m => m.id === req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Message content required' });

    const message = await prisma.message.create({
      data: {
        content,
        projectId: req.params.id,
        senderId: req.user.userId,
      },
      include: { sender: { select: { name: true, role: true } } },
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
