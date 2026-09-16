const dns = require('node:dns/promises');
dns.setServers(['1.1.1.1', '8.8.8.8']);


require('dotenv').config();
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const User = require('./models/User');
const Branch = require('./models/Branch');
const Product = require('./models/Product');
const BranchStock = require('./models/BranchStock');

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Branch.deleteMany({}),
    Product.deleteMany({}),
    BranchStock.deleteMany({}),
  ]);

  console.log('Creating admin user...');
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  await User.create({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    passwordHash,
    role: 'ADMIN',
  });

  console.log('Creating branches...');
  const branches = await Branch.insertMany([
    { name: 'Colombo Branch', location: { lat: 6.9271, lng: 79.8612, address: 'Colombo' }, maxCapacity: 20 },
    { name: 'Kandy Branch', location: { lat: 7.2906, lng: 80.6337, address: 'Kandy' }, maxCapacity: 20 },
    { name: 'Galle Branch', location: { lat: 6.0535, lng: 80.221, address: 'Galle' }, maxCapacity: 20 },
  ]);

  console.log('Creating products...');
  const products = await Product.insertMany([
    { name: 'Iced Coffee', sku: 'BEV-001', price: 450 },
    { name: 'Chicken Sandwich', sku: 'FOOD-001', price: 850 },
    { name: 'Chocolate Cake Slice', sku: 'DESS-001', price: 600 },
  ]);

  console.log('Setting initial stock...');
  const stockRows = [];
  for (const branch of branches) {
    for (const product of products) {
      stockRows.push({
        branch: branch._id,
        product: product._id,
        quantity: 10,
      });
    }
  }
  await BranchStock.insertMany(stockRows);

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
