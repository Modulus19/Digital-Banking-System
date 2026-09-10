const mongoose = require("mongoose");
const dns = require("dns");

if (process.env.MONGO_DNS_SERVER) {
  dns.setServers([process.env.MONGO_DNS_SERVER]);
}

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);

    process.exit(1);
  }
};

module.exports = connectDB;
