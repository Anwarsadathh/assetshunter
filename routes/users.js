// routes/users.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const propertyHelper = require("../helpers/property-helper");
const suggestHelper = require("../helpers/suggestion-helper");
const fs = require("fs");
const moment = require("moment");
const { log } = require("console");
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

router.get("/", async (req, res) => {
  try {
    const featuredProperties = await propertyHelper.getFeaturedProperties();
    const latestProperties = await propertyHelper.getLatestProperties();
    const locations = await propertyHelper.getAllLocations();
    const blogs = await propertyHelper.getAllBlogs(); // Fetch blogs from the database
    const gallery = await propertyHelper.getGallery(); // Fetch gallery images from the database
    const faqs = await propertyHelper.getAllFaqs(); // Fetch FAQs from the database

    console.log(gallery, "dd");

    res.render("user/home", {
      layout: "user-layout",
      title: "Assets Hunter",
      user: true,
      featuredProperties,
      latestProperties,
      locations,
      blogs, // Send blogs to the template
      gallery, // Send gallery images to the template
      faqs, // Send FAQs to the template
    });
  } catch (error) {
    console.error(error);
    res.render("user/home", {
      layout: "user-layout",
      title: "Assets Hunter",
      user: true,
      error: "Failed to load properties",
    });
  }
});
router.get("/blog/:id", async (req, res) => {
  try {
    const blogId = req.params.id;

    // Fetch blog details and recent posts
    const blog = await propertyHelper.getBlogById(blogId);
    const recentPosts = await propertyHelper.getRecentPosts();

    res.render("user/blog-detail", {
      blog,
      recentPosts,
      layout: "user-layout",
      title: `Blog: ${blog.title}`,
      user: true,
      helpers: {
        formatDate: function (date) {
          const moment = require("moment");
          return moment(date).format("MMMM Do YYYY");
        },
      },
    });
  } catch (error) {
    console.error("Error fetching blog details:", error);
    res.status(500).send("Server error");
  }
});

// Route to fetch gallery data and render the gallery page
router.get("/gallery", async (req, res) => {
  try {
    // Fetch gallery data from the database
    const gallery = await propertyHelper.getGallery();

    // Render the gallery page and pass the gallery data to the view
    res.render("user/gallery", {
      layout: "user-layout",
      title: "Assets Hunter",
      user: true,
      gallery: gallery,
    });
  } catch (error) {
    console.error("Error fetching gallery data:", error);
    res.status(500).send("Error fetching gallery data");
  }
});
// In your routes/users.js
router.get('/api/properties/status/:status', async (req, res) => {
    try {
        const status = req.params.status;
        let properties;
        
        if (status === 'All') {
            properties = await propertyHelper.getFeaturedProperties();
        } else {
            properties = await propertyHelper.getPropertiesByStatus(status); // Passing status here
        }

        res.json(properties);
    } catch (error) {
        console.error('Error fetching properties by status:', error);
        res.status(500).json({ error: 'Failed to fetch properties' });
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

router.get("/terms-conditions", (req, res) => {
  res.render("user/terms-and-conditions", {
    layout: "user-layout",
    user: true,
    title: "Terms and Conditions - Assets Hunter",
  });
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
router.get("/enquiry", (req, res) => {
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
    // Capture the form data
    const formData = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      propertyId: req.body.propertyId, // Brochure property ID
      propertyName: req.body.propertyName || "Unknown Property",
      propertyLocation: req.body.propertyLocation || "Not Specified",
      propertyType: req.body.propertyType || "Not Available",
      propertyPrice: req.body.propertyPrice || null,
      message: req.body.message || "",
      utmSource: req.body.utmSource || "direct",
      utmMedium: req.body.utmMedium || "",
      utmCampaign: req.body.utmCampaign || "",
      utmTerm: req.body.utmTerm || "",
      utmContent: req.body.utmContent || "",
      pageUrl: req.body.pageUrl,
      ipAddress: req.ip, // Capture user IP
      userAgent: req.get("User-Agent"), // Capture User-Agent header
      brochureDownloadTimestamp: new Date(),
      timestamp: new Date(),
      createdAt: new Date(),
      status: "new",
      viewed: false,
      contactedAt: null,
      notes: [], // Initialize as an empty array
    };

    // Save the form data to the database using the helper function
    const response = await suggestHelper.submitFormDataSug(formData);

    // Handle XHR request
    if (req.xhr) {
      return res.json({
        success: response.success,
        message: response.message,
      });
    }

    // Render appropriate view for non-XHR requests
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
    console.error("Error processing the form submission:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// In your routes file (e.g., routes/user.js)
router.get('/property/brochure/:id', async (req, res) => {
    try {
        const property = await propertyHelper.getPropertyById(req.params.id);
        if (!property || !property.brochure) {
            return res.status(404).send('Brochure not found');
        }

        // Get the full path by removing the leading '/'
        const brochurePath = path.join(process.cwd(), 'public', property.brochure.replace(/^\//, ''));

        // Check if file exists
        if (!fs.existsSync(brochurePath)) {
            return res.status(404).send('Brochure file not found');
        }

        // Send the file
        res.download(brochurePath);
    } catch (error) {
        console.error('Error downloading brochure:', error);
        res.status(500).send('Error downloading brochure');
    }
});
// Add this route
router.get('/property/check-brochure/:id', async (req, res) => {
    try {
        const property = await propertyHelper.getPropertyById(req.params.id);
        const hasBrochure = property && property.brochure && 
            fs.existsSync(path.join(process.cwd(), 'public', property.brochure.replace(/^\//, '')));
        
        res.json({ hasBrochure });
    } catch (error) {
        console.error('Error checking brochure:', error);
        res.status(500).json({ hasBrochure: false });
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
  res.render("user/terms-and-conditions", {
    layout: "user-layout",
    title: "Privacy Policy",
    user: true,
  });
});

// Privacy Policy Page
router.get("/about-us", (req, res) => {
  res.render("user/about", {
    layout: "user-layout",
    title: "Privacy Policy",
    user: true,
  });
});


module.exports = router;
