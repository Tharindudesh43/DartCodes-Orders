const dns = require('node:dns/promises');
dns.setServers(['1.1.1.1', '8.8.8.8']);

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

connectDB().catch(err => {
  console.error('Failed to connect to database:', err.message);
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server listening locally on port ${PORT}`);
  });
}

module.exports = app;