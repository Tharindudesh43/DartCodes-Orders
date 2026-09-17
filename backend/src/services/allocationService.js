const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const BranchStock = require('../models/BranchStock');
const { haversineDistanceKm } = require('../utils/geo');

const WEIGHTS = {
  proximity: 0.5,
  stockHealth: 0.2,
  workload: 0.3,
};

async function getEligibleBranches(orderItems, session) {
  const branches = await Branch.find({ isActive: true }).session(session);
  const eligible = [];

  for (const branch of branches) {
    const stockRows = await BranchStock.find({
      branch: branch._id,
      product: { $in: orderItems.map((i) => i.product) },
    }).session(session);

    const stockByProduct = new Map(stockRows.map((r) => [String(r.product), r.quantity]));

    const hasFullStock = orderItems.every((item) => {
      const available = stockByProduct.get(String(item.product)) || 0;
      return available >= item.quantity;
    });

    if (hasFullStock) {
      eligible.push({ branch, stockByProduct });
    }
  }

  return eligible;
}

function proximityScore(branch, deliveryLocation) {
  const distanceKm = haversineDistanceKm(
    { lat: branch.location.lat, lng: branch.location.lng },
    { lat: deliveryLocation.lat, lng: deliveryLocation.lng }
  );

  return 1 / (1 + distanceKm / 10);
}

function stockHealthScore(stockByProduct, orderItems) {
  const ratios = orderItems.map((item) => {
    const available = stockByProduct.get(String(item.product)) || 0;
    return Math.min(available / item.quantity, 3) / 3;
  });

  console.log("Stock health ratios: ", ratios);
  console.log("Stock health score: ", ratios.reduce((sum, r) => sum + r, 0) / ratios.length);
  return ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
}

function workloadScore(branch) {
  const utilization = branch.currentLoad / branch.maxCapacity;
  return Math.max(0, 1 - utilization);
}

function scoreAndPickBranch(eligibleBranches, orderItems, deliveryLocation) {
  if (eligibleBranches.length === 0) {
    return { branch: null, scored: [] };
  }

  const scored = eligibleBranches.map(({ branch, stockByProduct }) => {
    const proximity = proximityScore(branch, deliveryLocation);
    const stock = stockHealthScore(stockByProduct, orderItems);
    const workload = workloadScore(branch);

    console.log(`Branch ${branch.name} - Proximity: ${proximity.toFixed(3)}, Stock: ${stock.toFixed(3)}, Workload: ${workload.toFixed(3)}`);

    const score =
      WEIGHTS.proximity * proximity + WEIGHTS.stockHealth * stock + WEIGHTS.workload * workload;

    return { branch, score, breakdown: { proximity, stock, workload } };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.branch.currentLoad - b.branch.currentLoad;
  });

  return { branch: scored[0].branch, scored };
}


async function allocateAndReserve(orderItems, deliveryLocation) {
 
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const eligible = await getEligibleBranches(orderItems, session);

    const { branch, scored } = scoreAndPickBranch(eligible, orderItems, deliveryLocation);


    if (!branch) {
      await session.abortTransaction();
      return { branch: null, candidatesConsidered: eligible.length };
    }

    for (const item of orderItems) {
      const result = await BranchStock.updateOne(
        { branch: branch._id, product: item.product, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { session }
      );
      if (result.matchedCount === 0) {
        throw new Error('STOCK_CONFLICT'); 
      }
    }

    await Branch.updateOne({ _id: branch._id }, { $inc: { currentLoad: 1 } }, { session });

    await session.commitTransaction();

    const winning = scored.find((s) => String(s.branch._id) === String(branch._id));
    return {
      branch,
      score: winning.score,
      candidatesConsidered: eligible.length,
    };
  } catch (err) {
    await session.abortTransaction();
    if (err.message === 'STOCK_CONFLICT') {
      return { branch: null, candidatesConsidered: 0, conflict: true };
    }
    throw err;
  } finally {
    session.endSession();
  }
}

async function releaseAllocation(branchId, orderItems) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    for (const item of orderItems) {
      await BranchStock.updateOne(
        { branch: branchId, product: item.product },
        { $inc: { quantity: item.quantity } },
        { session, upsert: true }
      );
    }
    await Branch.updateOne(
      { _id: branchId },
      { $inc: { currentLoad: -1 } },
      { session }
    );
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = {
  getEligibleBranches,
  scoreAndPickBranch,
  allocateAndReserve,
  releaseAllocation,
  proximityScore,
  stockHealthScore,
  workloadScore,
};
