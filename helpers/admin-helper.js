// helpers/admin-helper.js
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const db = require("../config/connection");
const collection = require("../config/collection");

module.exports = {
  addBlog: (blogData) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        blogData.createdAt = new Date();
        await database
          .collection(collection.BLOG_COLLECTION)
          .insertOne(blogData);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  updateBlog: (blogId, updatedData) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();

        // Update the blog in the database by its ID
        const result = await database
          .collection(collection.BLOG_COLLECTION)
          .updateOne({ _id: new ObjectId(blogId) }, { $set: updatedData });

        // Check if a document was actually updated
        if (result.matchedCount === 0) {
          reject(new Error("Blog not found"));
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  addGalleryItem: (fieldname, galleryItems) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();

        // Upsert to add or update the gallery items for a specific fieldname
        await database.collection(collection.GALLERY_COLLECTION).updateOne(
          { fieldname }, // Match document with the same fieldname
          {
            $push: {
              items: { $each: galleryItems }, // Append new items to the array
            },
            $setOnInsert: { createdAt: new Date() }, // Set createdAt if the document is new
          },
          { upsert: true } // Create a new document if none exists
        );

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  deleteGalleryItem: async (fieldname, imageUrl) => {
    try {
      const database = db.getDb(); // Get the correct database instance
      const galleryCollection = database.collection("gallery"); // Use your collection name

      // Find the gallery entry by fieldname
      const galleryEntry = await galleryCollection.findOne({ fieldname });

      if (galleryEntry) {
        // Filter out the imageUrl from the items array
        const updatedItems = galleryEntry.items.filter(
          (item) => item.imageUrl !== imageUrl
        );

        // Update the document in the database
        await galleryCollection.updateOne(
          { fieldname },
          { $set: { items: updatedItems } }
        );
      }
    } catch (error) {
      throw new Error("Error deleting gallery item: " + error.message);
    }
  },
  // Get all blogs
  getAllBlogs: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const blogs = await database
          .collection(collection.BLOG_COLLECTION)
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        resolve(blogs);
      } catch (error) {
        reject(error);
      }
    });
  },
  getBlogById: (blogId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const blog = await database
          .collection(collection.BLOG_COLLECTION)
          .findOne({ _id: new ObjectId(blogId) });

        if (blog) {
          resolve(blog);
        } else {
          resolve(null); // No blog found with the given ID
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  // Delete a blog
  deleteBlog: (blogId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        await database
          .collection(collection.BLOG_COLLECTION)
          .deleteOne({ _id: new ObjectId(blogId) });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  addBlog: (blogData) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        blogData.createdAt = new Date(); // Add timestamp
        await database
          .collection(collection.BLOG_COLLECTION)
          .insertOne(blogData);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get all FAQs
  getAllFaqs: async () => {
    try {
      const database = db.getDb(); // Assuming db.getDb() returns the database instance
      const faqs = await database
        .collection(collection.FAQ_COLLECTION) // Use the correct collection name for FAQs
        .find()
        .toArray();
      return faqs;
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      throw error;
    }
  },

  // Add a new FAQ to the database
  addFaq: async (faqData) => {
    try {
      const database = db.getDb(); // Assuming db.getDb() returns the database instance
      faqData.createdAt = new Date(); // Add timestamp if needed
      await database
        .collection(collection.FAQ_COLLECTION) // Use the correct collection name for FAQs
        .insertOne(faqData);
    } catch (error) {
      console.error("Error adding FAQ:", error);
      throw error;
    }
  },

  // Delete an FAQ from the database
  deleteFaq: async (id) => {
    try {
      const database = db.getDb(); // Assuming db.getDb() returns the database instance
      await database
        .collection(collection.FAQ_COLLECTION) // Use the correct collection name for FAQs
        .deleteOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      throw error;
    }
  },
  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const admin = await database
          .collection(collection.ADMIN_COLLECTION)
          .findOne({ username: adminData.username });

        if (admin) {
          const status = await bcrypt.compare(
            adminData.password,
            admin.password
          );
          if (status) {
            resolve({ status: true, admin });
          } else {
            resolve({ status: false });
          }
        } else {
          resolve({ status: false });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getAllEnquiries: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const enquiries = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        resolve(enquiries);
      } catch (error) {
        reject(error);
      }
    });
  },
  // Add these functions to your admin-helper.js file

  // Get all enquiries
  getAllEnquiries: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const enquiries = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        resolve(enquiries);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get single enquiry by ID
  getEnquiryById: (enquiryId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const enquiry = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .findOne({ _id: new ObjectId(enquiryId) });
        resolve(enquiry);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Update enquiry status
  updateEnquiryStatus: (enquiryId, status, updateInfo) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const result = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .updateOne(
            { _id: new ObjectId(enquiryId) },
            {
              $set: {
                status: status,
                updatedBy: updateInfo.updatedBy,
                updatedAt: updateInfo.updatedAt,
                contactedAt: status === "contacted" ? new Date() : null,
              },
            }
          );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Add note to enquiry
  addEnquiryNote: (enquiryId, note) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const result = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .updateOne(
            { _id: new ObjectId(enquiryId) },
            {
              $push: { notes: note },
              $set: { updatedAt: new Date() },
            }
          );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Delete enquiry
  deleteEnquiry: (enquiryId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const result = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .deleteOne({ _id: new ObjectId(enquiryId) });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get multiple enquiries by IDs
  getEnquiriesByIds: (enquiryIds) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const objectIds = enquiryIds.map((id) => new ObjectId(id));
        const enquiries = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .find({ _id: { $in: objectIds } })
          .toArray();
        resolve(enquiries);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get enquiry statistics
  getEnquiryStats: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const stats = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                new: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "new"] }, 1, 0],
                  },
                },
                contacted: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "contacted"] }, 1, 0],
                  },
                },
                closed: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "closed"] }, 1, 0],
                  },
                },
                todayCount: {
                  $sum: {
                    $cond: [
                      {
                        $gte: [
                          "$createdAt",
                          new Date(new Date().setHours(0, 0, 0, 0)),
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ])
          .toArray();
        resolve(
          stats[0] || {
            total: 0,
            new: 0,
            contacted: 0,
            closed: 0,
            todayCount: 0,
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get enquiries by date range
  getEnquiriesByDateRange: (startDate, endDate) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const enquiries = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .find({
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          })
          .sort({ createdAt: -1 })
          .toArray();
        resolve(enquiries);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Search enquiries
  searchEnquiries: (searchTerm) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const enquiries = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .find({
            $or: [
              { name: { $regex: searchTerm, $options: "i" } },
              { email: { $regex: searchTerm, $options: "i" } },
              { mobile: { $regex: searchTerm, $options: "i" } },
              { message: { $regex: searchTerm, $options: "i" } },
            ],
          })
          .sort({ createdAt: -1 })
          .toArray();
        resolve(enquiries);
      } catch (error) {
        reject(error);
      }
    });
  },

  getDashboardStats: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();

        // Get property stats
        const propertyStats = await database
          .collection(collection.PROPERTY_COLLECTION)
          .aggregate([
            {
              $group: {
                _id: null,
                totalProperties: { $sum: 1 },
                totalActive: {
                  $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                },
                totalFeatured: {
                  $sum: { $cond: [{ $eq: ["$featured", true] }, 1, 0] },
                },
              },
            },
          ])
          .toArray();

        // Get enquiry stats
        const enquiryStats = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .aggregate([
            {
              $group: {
                _id: null,
                totalEnquiries: { $sum: 1 },
                newEnquiries: {
                  $sum: {
                    $cond: [
                      {
                        $gte: [
                          "$createdAt",
                          new Date(Date.now() - 24 * 60 * 60 * 1000),
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ])
          .toArray();

        // Get monthly enquiry stats
        const monthlyEnquiries = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .aggregate([
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 6 },
          ])
          .toArray();

        // Get location-wise property distribution
        const locationStats = await database
          .collection(collection.PROPERTY_COLLECTION)
          .aggregate([
            {
              $group: {
                _id: "$location",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ])
          .toArray();

        resolve({
          properties: propertyStats[0] || {
            totalProperties: 0,
            totalActive: 0,
            totalFeatured: 0,
          },
          enquiries: enquiryStats[0] || {
            totalEnquiries: 0,
            newEnquiries: 0,
          },
          monthlyEnquiries,
          locationStats,
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  updateEnquiryStatus: (enquiryId, status) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const result = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .updateOne(
            { _id: new ObjectId(enquiryId) },
            { $set: { status: status, updatedAt: new Date() } }
          );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteEnquiry: (enquiryId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const result = await database
          .collection(collection.ENQUIRY_COLLECTION)
          .deleteOne({ _id: new ObjectId(enquiryId) });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Admin password change
  changePassword: (adminId, currentPassword, newPassword) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const admin = await database
          .collection(collection.ADMIN_COLLECTION)
          .findOne({ _id: new ObjectId(adminId) });

        if (admin) {
          const status = await bcrypt.compare(currentPassword, admin.password);
          if (status) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const result = await database
              .collection(collection.ADMIN_COLLECTION)
              .updateOne(
                { _id: new ObjectId(adminId) },
                { $set: { password: hashedPassword } }
              );
            resolve({ status: true, result });
          } else {
            resolve({
              status: false,
              message: "Current password is incorrect",
            });
          }
        } else {
          resolve({ status: false, message: "Admin not found" });
        }
      } catch (error) {
        reject(error);
      }
    });
  },
};
