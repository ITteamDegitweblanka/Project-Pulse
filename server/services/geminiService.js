require('dotenv').config();

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn('API_KEY environment variable not set. AI features will be disabled.');
}

module.exports = {};
