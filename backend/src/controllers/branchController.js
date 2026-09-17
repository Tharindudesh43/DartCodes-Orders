const Branch = require('../models/Branch');

//POST /api/branches (admin)
async function createBranch(req, res) {
  try {
    const { name, location, maxCapacity } = req.body;
    if (!name || !location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ error: 'name and a valid location (lat, lng) are required' });
    }
    const branch = await Branch.create({ name, location, maxCapacity });
    return res.status(201).json({ branch });
  } catch (err) {
    console.error('createBranch error:', err);
    return res.status(500).json({ error: 'Something went wrong creating the branch' });
  }
}

//GET /api/branches
async function listBranches(req, res) {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    return res.json({ branches });
  } catch (err) {
    console.error('listBranches error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching branches' });
  }
}

//PATCH /api/branches/:id (admin)
async function updateBranch(req, res) {
  try {
    const { name, location, isActive, maxCapacity } = req.body;
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    if (name !== undefined) branch.name = name;
    if (location !== undefined) branch.location = { ...branch.location.toObject(), ...location };
    if (isActive !== undefined) branch.isActive = Boolean(isActive);
    if (maxCapacity !== undefined) branch.maxCapacity = maxCapacity;

    await branch.save();
    return res.json({ branch });
  } catch (err) {
    console.error('updateBranch error:', err);
    return res.status(500).json({ error: 'Something went wrong updating the branch' });
  }
}

module.exports = { createBranch, listBranches, updateBranch };
