// config/connection.js

const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB Connection URI
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "real_estate";

// Connection Options
const options = {
  maxPoolSize: 50,
  wtimeoutMS: 2500,
  connectTimeoutMS: 10000,
};

let client = null;
let db = null;

module.exports = {
  // Connect to MongoDB
  connectToServer: async function () {
    try {
      // Create a new MongoClient if not exists
      if (!client) {
        client = new MongoClient(uri, options);
      }

      // Connect to MongoDB
      await client.connect();
      console.log("Successfully connected to MongoDB.");

      // Store the db instance
      db = client.db(dbName);

      return db;
    } catch (err) {
      console.error("Error connecting to MongoDB:", err);
      throw err;
    }
  },

  // Get the database instance
  getDb: function () {
    if (!db) {
      throw new Error("Database not initialized. Call connectToServer first.");
    }
    return db;
  },

  // Get the MongoDB client instance
  getClient: function () {
    if (!client) {
      throw new Error("Client not initialized. Call connectToServer first.");
    }
    return client;
  },

  // Close the database connection
  closeConnection: async function () {
    if (client) {
      try {
        await client.close();
        client = null;
        db = null;
        console.log("MongoDB connection closed.");
      } catch (err) {
        console.error("Error closing MongoDB connection:", err);
        throw err;
      }
    }
  },
};
