// helpers/property-helper.js
const { ObjectId } = require("mongodb");
const db = require("../config/connection");
const collection = require("../config/collection");

module.exports = {
  // Get all locations
  getAllLocations: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const locations = await database
          .collection(collection.PROPERTY_COLLECTION)
          .distinct("location");
        resolve(locations);
      } catch (error) {
        reject(error);
      }
    });
  },
  // Helper to get all gallery images
  getGallery: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb(); // Connect to the database
        const galleryImages = await database
          .collection(collection.GALLERY_COLLECTION) // Assuming collection name is GALLERY_COLLECTION
          .find()
          .sort({ createdAt: -1 }) // Sort images by creation date (most recent first)
          .toArray();
        resolve(galleryImages); // Return the gallery images array
      } catch (error) {
        reject(error); // Handle any errors
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
        resolve(blog);
      } catch (error) {
        reject(error);
      }
    });
  },
  // New getRecentPosts function
  getRecentPosts: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        // Fetch the latest 5 blogs, sorted by createdAt (descending order)
        const recentPosts = await database
          .collection(collection.BLOG_COLLECTION)
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray();
        resolve(recentPosts);
      } catch (error) {
        reject(error);
      }
    });
  },
  // Get all properties
  getAllProperties: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const properties = await database
          .collection(collection.PROPERTY_COLLECTION)
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        resolve(properties);
      } catch (error) {
        reject(error);
      }
    });
  },
  getUniqueLocations: async () => {
    const database = db.getDb();
    const locations = await database
      .collection(collection.PROPERTY_COLLECTION)
      .distinct("location");
    return locations;
  },
  getNavigationData: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();

        // Get project counts by status
        const projectsByStatus = await database
          .collection(collection.PROPERTY_COLLECTION)
          .aggregate([
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                status: "$_id",
                count: 1,
                _id: 0,
              },
            },
            { $sort: { count: -1 } },
          ])
          .toArray();

        // Get location counts
        const locationCounts = await database
          .collection(collection.PROPERTY_COLLECTION)
          .aggregate([
            {
              $group: {
                _id: "$location",
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                location: "$_id",
                count: 1,
                _id: 0,
              },
            },
            { $sort: { count: -1 } },
          ])
          .toArray();

        resolve({
          navProjects: projectsByStatus,
          navLocations: locationCounts,
        });
      } catch (error) {
        reject(error);
      }
    });
  },
  getUniquePropertyTypes: async () => {
    const database = db.getDb();
    const propertyTypes = await database
      .collection(collection.PROPERTY_COLLECTION)
      .distinct("propertyType");
    return propertyTypes;
  },
  // Get properties with pagination and filters
  getPropertiesWithPagination: (page = 1, limit = 9, filters = {}) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const skip = (page - 1) * limit;

        // Build query based on filters
        let query = {};
        if (filters.location)
          query.location = { $regex: new RegExp(filters.location, "i") };
        if (filters.type) query.propertyType = filters.type;
        if (filters.status) query.status = filters.status;
        if (filters.minPrice)
          query.price = { $gte: parseFloat(filters.minPrice) };
        if (filters.maxPrice) {
          query.price = { ...query.price, $lte: parseFloat(filters.maxPrice) };
        }

        const total = await database
          .collection(collection.PROPERTY_COLLECTION)
          .countDocuments(query);

        const properties = await database
          .collection(collection.PROPERTY_COLLECTION)
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();

        resolve({ properties, total });
      } catch (error) {
        reject(error);
      }
    });
  },
  getAllBlogs: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const blogs = await database
          .collection(collection.BLOG_COLLECTION)
          .find()
          .sort({ createdAt: -1 })
          .toArray(); // Sort blogs by creation date
        resolve(blogs);
      } catch (error) {
        reject(error);
      }
    });
  },

  getFeaturedProperties: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        console.log("Fetching featured properties...");
        const properties = await database
          .collection(collection.PROPERTY_COLLECTION)
          .find({ featured: "on" })
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        console.log("Featured properties:", properties);
        resolve(properties);
      } catch (error) {
        console.error("Error fetching featured properties:", error);
        reject(error);
      }
    });
  },
  // In your propertyHelper.js
  getPropertiesByStatus: (status) => {
    // Add status parameter here
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        console.log("Fetching properties by status:", status);
        const properties = await database
          .collection(collection.PROPERTY_COLLECTION)
          .find({
            featured: "on",
            status: status,
          })
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        console.log("Properties by status:", properties);
        resolve(properties);
      } catch (error) {
        console.error("Error fetching properties by status:", error);
        reject(error);
      }
    });
  },

  // Get latest properties
  getLatestProperties: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const properties = await database
          .collection(collection.PROPERTY_COLLECTION)
          .find()
          .sort({ createdAt: -1 })
          .limit(4)
          .toArray();
        resolve(properties);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get property by ID
  getPropertyById: (propertyId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const property = await database
          .collection(collection.PROPERTY_COLLECTION)
          .findOne({ _id: new ObjectId(propertyId) });
        resolve(property);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get properties by location
  getPropertiesByLocation: (location) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const properties = await database
          .collection(collection.PROPERTY_COLLECTION)
          .find({ location: { $regex: new RegExp(location, "i") } })
          .sort({ createdAt: -1 })
          .toArray();
        resolve(properties);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get similar properties
  getSimilarProperties: (property) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const properties = await database
          .collection(collection.PROPERTY_COLLECTION)
          .find({
            _id: { $ne: property._id },
            $or: [
              { location: property.location },
              { propertyType: property.propertyType },
              {
                price: {
                  $gte: property.price * 0.8,
                  $lte: property.price * 1.2,
                },
              },
            ],
          })
          .limit(3)
          .toArray();
        resolve(properties);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Search properties
  searchProperties: (filters) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        let query = {};

        if (filters.location) {
          query.location = { $regex: new RegExp(filters.location, "i") };
        }
        if (filters.type) {
          query.propertyType = filters.type;
        }
        if (filters.status) {
          query.status = filters.status;
        }
        if (filters.budget) {
          const [min, max] = filters.budget.split("-");
          query.price = {};
          if (min !== "") query.price.$gte = parseFloat(min);
          if (max !== "") query.price.$lte = parseFloat(max);
        }

        const properties = await database
          .collection(collection.PROPERTY_COLLECTION)
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        resolve(properties);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Add property
  addProperty: (propertyData) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const result = await database
          .collection(collection.PROPERTY_COLLECTION)
          .insertOne(propertyData);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Update property
  updateProperty: (propertyId, propertyData) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const result = await database
          .collection(collection.PROPERTY_COLLECTION)
          .updateOne({ _id: new ObjectId(propertyId) }, { $set: propertyData });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Delete property
  deleteProperty: (propertyId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const result = await database
          .collection(collection.PROPERTY_COLLECTION)
          .deleteOne({ _id: new ObjectId(propertyId) });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Toggle featured status
  toggleFeatured: (propertyId, featured) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const result = await database
          .collection(collection.PROPERTY_COLLECTION)
          .updateOne(
            { _id: new ObjectId(propertyId) },
            { $set: { featured: featured } }
          );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get property statistics
  getPropertyStats: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = db.getDb();
        const stats = await database
          .collection(collection.PROPERTY_COLLECTION)
          .aggregate([
            {
              $group: {
                _id: null,
                totalProperties: { $sum: 1 },
                totalFeatured: {
                  $sum: { $cond: [{ $eq: ["$featured", true] }, 1, 0] },
                },
                avgPrice: { $avg: "$price" },
                totalValue: { $sum: "$price" },
              },
            },
          ])
          .toArray();
        resolve(
          stats[0] || {
            totalProperties: 0,
            totalFeatured: 0,
            avgPrice: 0,
            totalValue: 0,
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  },
};
