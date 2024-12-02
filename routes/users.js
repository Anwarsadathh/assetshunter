// routes/users.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const propertyHelper = require("../helpers/property-helper");
const suggestHelper = require("../helpers/suggestion-helper");

// Middleware for verifying user login
function verifyLogin(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/uploads");
    require("fs").mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Home Page
router.get("/", async (req, res) => {
  try {
    const featuredProperties = await propertyHelper.getFeaturedProperties();
    const latestProperties = await propertyHelper.getLatestProperties();
    const locations = await propertyHelper.getAllLocations();

    // Log the fetched properties
    console.log("Featured Properties:", featuredProperties);
    console.log("Latest Properties:", latestProperties);
    console.log("Locations:", locations);

    res.render("user/home", {
      layout: "user-layout",
      title: "Welcome to Real Estate",
      user: true,
      featuredProperties,
      latestProperties,
      locations,
    });
  } catch (error) {
    console.error(error);
    res.render("user/home", {
      layout: "user-layout",
      title: "Welcome to Real Estate",
      user: true,
      error: "Failed to load properties",
    });
  }
});

router.get("/properties", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;

    // Construct the filters object
    const filters = {
      location: req.query.location || "",
      type: req.query.type || "",
      status: req.query.status || "",
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : null,
    };

    // Fetch the properties with pagination and filters
    const { properties, total } =
      await propertyHelper.getPropertiesWithPagination(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    // Fetch the unique locations and property types
    const locations = await propertyHelper.getUniqueLocations();
    const propertyTypes = await propertyHelper.getUniquePropertyTypes();

    res.render("user/properties", {
      layout: "user-layout",
      title: "Properties",
      user: true,
      properties,
      pagination: {
        current: page,
        total: totalPages,
        pages: Array.from({ length: totalPages }, (_, i) => i + 1),
      },
      filters: {
        location: req.query.location || "",
        type: req.query.type || "",
        status: req.query.status || "",
        minPrice: req.query.minPrice || null,
        maxPrice: req.query.maxPrice || null,
      },
      locations,
      propertyTypes,
    });
  } catch (error) {
    console.error(error);
    res.render("user/properties", {
      layout: "user-layout",
      title: "Properties",
      user: true,
      error: "Failed to load properties",
    });
  }
});
// Update your route handler
router.get("/properties", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 9;

        // Construct the filters object
        const filters = {
            location: req.query.location || "",
            type: req.query.type || "",
            status: req.query.status || "",
            minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : null,
            maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : null,
        };

        // Fetch the properties with pagination and filters
        const { properties, total } = await propertyHelper.getPropertiesWithPagination(page, limit, filters);
        const totalPages = Math.ceil(total / limit);

        // Fetch the unique locations and property types
        const locations = await propertyHelper.getUniqueLocations();
        const propertyTypes = await propertyHelper.getUniquePropertyTypes();

        // Get navigation data
        const navData = await propertyHelper.getNavigationData();

        res.render("user/properties", {
            layout: "user-layout",
            title: "Properties",
            user: true,
            properties,
            pagination: {
                current: page,
                total: totalPages,
                pages: Array.from({ length: totalPages }, (_, i) => i + 1),
            },
            filters: {
                location: req.query.location || "",
                type: req.query.type || "",
                status: req.query.status || "",
                minPrice: req.query.minPrice || null,
                maxPrice: req.query.maxPrice || null,
            },
            locations,
            propertyTypes,
            navProjects: navData.navProjects,
            navLocations: navData.navLocations,
            isProperties: true // For active nav state
        });
    } catch (error) {
        console.error(error);
        res.render("user/properties", {
            layout: "user-layout",
            title: "Properties",
            user: true,
            error: "Failed to load properties"
        });
    }
});


// Property Details Page
router.get("/properties/:id", async (req, res) => {
  try {
    const property = await propertyHelper.getPropertyById(req.params.id);
    if (!property) {
      return res.status(404).render("error", {
        layout: "user-layout",
        title: "Not Found",
        error: {
          status: 404,
          message: "Property not found",
        },
      });
    }

    const similarProperties = await propertyHelper.getSimilarProperties(
      property
    );

    res.render("user/property-details", {
      layout: "user-layout",
      title: property.projectName,
      user: true,
      property,
      similarProperties,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      layout: "user-layout",
      title: "Error",
      error: {
        status: 500,
        message: "Failed to load property details",
      },
    });
  }
});

// About Page
router.get("/about", (req, res) => {
  res.render("user/about", {
    layout: "user-layout",
    title: "About Us",
    user: true,
  });
});

// Contact Page
router.get("/contact", (req, res) => {
  res.render("user/contact", {
    layout: "user-layout",
    title: "Contact Us",
    user: true,
  });
});

// Enquiry Form Page
router.get("/submit-form", (req, res) => {
  res.render("user/form-submit", {
    layout: "user-layout",
    title: "Submit Enquiry",
    user: true,
    error: null,
    success: null,
  });
});

router.post("/submit-form", upload.none(), async (req, res) => {
  try {
    const formData = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      message: req.body.message,
      utmSource: req.body.utmSource,
      utmMedium: req.body.utmMedium,
      utmCampaign: req.body.utmCampaign,
      utmTerm: req.body.utmTerm,
      utmContent: req.body.utmContent,
      pageUrl: req.body.pageUrl,
      timestamp: new Date(),
      createdAt: new Date(),
    };

    const response = await suggestHelper.submitFormDataSug(formData);

    if (req.xhr) {
      return res.json({
        success: response.success,
        message: response.message,
      });
    }

    if (response.success) {
      res.render("user/form-submit", {
        layout: "user-layout",
        title: "Submit Form",
        error: null,
        success: response.message,
      });
    } else {
      res.render("user/form-submit", {
        layout: "user-layout",
        title: "Submit Form",
        error: response.message,
        success: null,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// Search Properties
router.get("/search", async (req, res) => {
  try {
    const filters = {
      location: req.query.location,
      type: req.query.type,
      budget: req.query.budget,
      status: req.query.status,
    };

    const properties = await propertyHelper.searchProperties(filters);

    if (req.xhr) {
      return res.json({
        success: true,
        properties,
      });
    }

    res.render("user/search-results", {
      layout: "user-layout",
      title: "Search Results",
      user: true,
      properties,
      filters,
    });
  } catch (error) {
    console.error(error);
    if (req.xhr) {
      return res.status(500).json({
        success: false,
        message: "Failed to search properties",
      });
    }

    res.render("user/search-results", {
      layout: "user-layout",
      title: "Search Results",
      user: true,
      error: "Failed to search properties",
    });
  }
});

// Location Based Properties
router.get("/location/:location", async (req, res) => {
  try {
    const properties = await propertyHelper.getPropertiesByLocation(
      req.params.location
    );
    res.render("user/location-properties", {
      layout: "user-layout",
      title: `Properties in ${req.params.location}`,
      user: true,
      location: req.params.location,
      properties,
    });
  } catch (error) {
    console.error(error);
    res.render("user/location-properties", {
      layout: "user-layout",
      title: `Properties in ${req.params.location}`,
      user: true,
      error: "Failed to load properties",
    });
  }
});



// Download Brochure
router.get("/download-brochure/:id", async (req, res) => {
  try {
    const property = await propertyHelper.getPropertyById(req.params.id);
    if (!property || !property.brochureUrl) {
      return res.status(404).send("Brochure not found");
    }

    const brochurePath = path.join(
      __dirname,
      "../public",
      property.brochureUrl
    );
    res.download(brochurePath);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to download brochure");
  }
});

// Privacy Policy Page
router.get("/privacy-policy", (req, res) => {
  res.render("user/privacy-policy", {
    layout: "user-layout",
    title: "Privacy Policy",
    user: true,
  });
});

// Terms and Conditions Page
router.get("/terms-conditions", (req, res) => {
  res.render("user/terms-conditions", {
    layout: "user-layout",
    title: "Terms & Conditions",
    user: true,
  });
});

module.exports = router;
