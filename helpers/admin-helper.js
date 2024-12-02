// helpers/admin-helper.js
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const db = require("../config/connection");
const collection = require("../config/collection");

module.exports = {
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
                            contactedAt: status === 'contacted' ? new Date() : null
                        }
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
                        $set: { updatedAt: new Date() }
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
            const objectIds = enquiryIds.map(id => new ObjectId(id));
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
                                    $cond: [{ $eq: ["$status", "new"] }, 1, 0]
                                }
                            },
                            contacted: {
                                $sum: {
                                    $cond: [{ $eq: ["$status", "contacted"] }, 1, 0]
                                }
                            },
                            closed: {
                                $sum: {
                                    $cond: [{ $eq: ["$status", "closed"] }, 1, 0]
                                }
                            },
                            todayCount: {
                                $sum: {
                                    $cond: [
                                        {
                                            $gte: [
                                                "$createdAt",
                                                new Date(new Date().setHours(0, 0, 0, 0))
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ])
                .toArray();
            resolve(stats[0] || {
                total: 0,
                new: 0,
                contacted: 0,
                closed: 0,
                todayCount: 0
            });
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
                        $lte: new Date(endDate)
                    }
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
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } },
                        { mobile: { $regex: searchTerm, $options: 'i' } },
                        { message: { $regex: searchTerm, $options: 'i' } }
                    ]
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
