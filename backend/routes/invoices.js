const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get Invoices for a Project (Admins and Members can view)
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: { members: true },
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Access check
    if (req.user.role !== 'ADMIN' && !project.members.some(m => m.id === req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { projectId: req.params.projectId },
      include: { timeLogs: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate Invoice (Admin Only)
router.post('/generate', protect, admin, async (req, res) => {
  try {
    const { projectId, hourlyRate } = req.body;
    const rate = parseFloat(hourlyRate) || 50.0; // Default $50/hr if not provided

    // Find all APPROVED, Billable TimeLogs that are NOT yet invoiced for this project
    const unbilledLogs = await prisma.timeLog.findMany({
      where: {
        projectId,
        status: 'APPROVED',
        isBillable: true,
        invoiceId: null,
      }
    });

    if (unbilledLogs.length === 0) {
      return res.status(400).json({ message: 'No unbilled approved hours found to generate an invoice.' });
    }

    // Calculate total amount
    const totalHours = unbilledLogs.reduce((sum, log) => sum + log.hours, 0);
    const amount = totalHours * rate;

    // Create Invoice and link TimeLogs
    const invoice = await prisma.invoice.create({
      data: {
        projectId,
        amount,
        status: 'DRAFT',
        timeLogs: {
          connect: unbilledLogs.map(log => ({ id: log.id }))
        }
      },
      include: { timeLogs: true }
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Invoice Status (Admin Only)
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body; // DRAFT, SENT, PAID
    
    if (!['DRAFT', 'SENT', 'PAID'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
