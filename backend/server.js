require("dotenv").config();

const mongoose = require("mongoose");
const dns = require("node:dns");
const app = require("./src/app");

// Force Google & Cloudflare DNS
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const PORT = process.env.PORT || 5000;

// Print URI (password hidden)
const safeUri = process.env.MONGODB_URI
  ? process.env.MONGODB_URI.replace(/\/\/(.*?):(.*?)@/, "//$1:******@")
  : "NOT FOUND";

console.log("=================================");
console.log("Node Version :", process.version);
console.log("Mongo URI    :", safeUri);
console.log("=================================");

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("\n========== FULL ERROR ==========");
    console.dir(err, { depth: null });

    console.log("\nError Name:");
    console.log(err.name);

    console.log("\nError Message:");
    console.log(err.message);

    console.log("\nError Cause:");
    console.log(err.cause);

    console.log("\nStack Trace:");
    console.log(err.stack);

    console.log("================================");
    process.exit(1);
  });