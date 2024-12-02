// seeders/adminSeeder.js

const bcrypt = require("bcrypt");
const db = require("../config/connection");
const collection = require("../config/collection");

async function seedAdmin() {
  try {
    // Connect to database
    await db.connectToServer();
    const database = db.getDb();

    // Admin user data
    const adminData = {
      username: "admin",
      password: await bcrypt.hash("admin123", 10),
      email: "admin@example.com",
      role: "superadmin",
      status: "active",
      createdAt: new Date(),
      lastLogin: null,
      permissions: ["all"],
    };

    // Check if admin already exists
    const existingAdmin = await database
      .collection(collection.ADMIN_COLLECTION)
      .findOne({ username: adminData.username });

    if (existingAdmin) {
      console.log("Admin user already exists");
    } else {
      // Insert admin user
      const result = await database
        .collection(collection.ADMIN_COLLECTION)
        .insertOne(adminData);

      if (result.acknowledged) {
        console.log("Admin user created successfully");
        console.log("Username:", adminData.username);
        console.log("Password: admin123");
      }
    }

    // Close database connection
    await db.closeConnection();
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}

// Run the seeder
seedAdmin();
