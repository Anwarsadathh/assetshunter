// routes/admin.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const propertyHelper = require("../helpers/property-helper");
const adminHelper = require("../helpers/admin-helper");

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = "public/uploads/properties";
        if (file.fieldname === "floorPlanImages") {
            uploadPath = "public/uploads/floorplans";
        } else if (file.fieldname === "brochure") {
            uploadPath = "public/uploads/brochures";
        }
        // Create directory if it doesn't exist
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
        );
    },
});


const uploads = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = "public/uploads/blogs";
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
});

// Configure multer with file validation
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "brochure") {
            // Check if it's a PDF
            if (file.mimetype === "application/pdf") {
                cb(null, true);
            } else {
                cb(new Error("Please upload a PDF file for brochure."), false);
            }
        } else if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type!"), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for all files
        files: 16, // Total files limit (10 property images + 5 floor plans + 1 brochure)
    },
});

// Define upload fields
const uploadFields = [
    { name: "images", maxCount: 10 },
    { name: "floorPlanImages", maxCount: 5 },
    { name: "brochure", maxCount: 1 }
];


// Admin authentication middleware
const verifyAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};




// Route to display blog management page (GET)
router.get("/blogs", verifyAdmin, async (req, res) => {
  try {
    const blogs = await adminHelper.getAllBlogs();
    res.render("admin/blogs", {
      layout: false,
      title: "Manage Blogs",
      blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    req.flash("error", "Something went wrong while fetching blogs.");
    res.redirect("/admin/dashboard");
  }
});

// Route to display the add blog page (GET)
router.get("/blogs/add", verifyAdmin, (req, res) => {
  res.render("admin/add-blog", {
    layout: false,
    title: "Add Blog",
  });
});

// Route to handle blog submission (POST)
router.post(
  "/blogs/add",
  uploads.single("image"), // Handles blog image upload
  verifyAdmin,
  async (req, res) => {
    try {
      const blogData = req.body;
      if (req.file) {
        blogData.imagePath = `/uploads/blogs/${req.file.filename}`;
      }
      await adminHelper.addBlog(blogData);
      req.flash("success", "Blog added successfully!");
      res.redirect("/admin/blogs");
    } catch (error) {
      console.error("Error adding blog:", error);
      req.flash("error", "Failed to add the blog.");
      res.redirect("/admin/blogs/add");
    }
  }
);
// Route to display edit blog page (GET)
router.get("/blogs/edit/:id", verifyAdmin, async (req, res) => {
  try {
    const blog = await adminHelper.getBlogById(req.params.id);
    if (!blog) {
      req.flash("error", "Blog not found");
      return res.redirect("/admin/blogs");
    }
    res.render("admin/edit-blog", {
      layout: false,
      title: "Edit Blog",
      blog,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    req.flash("error", "Something went wrong while fetching the blog.");
    res.redirect("/admin/blogs");
  }
});


// Route to handle blog edit (POST)
router.post(
  "/blogs/edit/:id",
  uploads.single("image"), // Handle the uploaded image
  verifyAdmin,
  async (req, res) => {
    try {
      const blogId = req.params.id;
      const updatedData = req.body;

      // Check if a new image is uploaded
      if (req.file) {
        updatedData.imagePath = `/uploads/blogs/${req.file.filename}`;

        // Delete the old image if it exists
        const existingBlog = await adminHelper.getBlogById(blogId);
        if (existingBlog && existingBlog.imagePath) {
          const oldImagePath = path.join(__dirname, "..", "public", existingBlog.imagePath);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath); // Remove old image
          }
        }
      }

      // Update the blog
      await adminHelper.updateBlog(blogId, updatedData);

      req.flash("success", "Blog updated successfully!");
      res.redirect("/admin/blogs");
    } catch (error) {
      console.error("Error updating blog:", error);
      req.flash("error", "Something went wrong while updating the blog.");
      res.redirect(`/admin/blogs/edit/${req.params.id}`);
    }
  }
);
// Route to delete a blog (POST)
router.post("/blogs/delete/:id", verifyAdmin, async (req, res) => {
  try {
    const blogId = req.params.id;
    await adminHelper.deleteBlog(blogId);
    req.flash("success", "Blog deleted successfully!");
    res.redirect("/admin/blogs");
  } catch (error) {
    console.error("Error deleting blog:", error);
    req.flash("error", "Failed to delete the blog.");
    res.redirect("/admin/blogs");
  }
});


// Login page
router.get("/login", (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  res.render("admin/login", {
    layout: false,
    title: "Admin Login",
  });
});

// Root route redirect to login
router.get("/", (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin/dashboard");
  } else {
    res.redirect("/admin/login");
  }
});

// Login process
router.post("/login", async (req, res) => {
  try {
    const result = await adminHelper.doLogin(req.body);
    if (result.status) {
      req.session.admin = result.admin;
      res.redirect("/admin/dashboard");
    } else {
      req.flash("error", "Invalid username or password");
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong");
    res.redirect("/admin/login");
  }
});

// Admin dashboard
router.get("/dashboard", verifyAdmin, async (req, res) => {
  try {
    const stats = await adminHelper.getDashboardStats();
    res.render("admin/dashboard", {
      layout: "admin-layout",
      admin: true,
      title: "Dashboard",
      isDashboard: true,
      stats,
    });
  } catch (error) {
    console.error(error);
    res.render("admin/dashboard", {
      layout: "admin-layout",
      admin: true,
      title: "Dashboard",
      isDashboard: true,
      error: "Failed to load dashboard stats",
    });
  }
});

// Properties list
router.get("/properties", verifyAdmin, async (req, res) => {
  try {
    const properties = await propertyHelper.getAllProperties();
    res.render("admin/properties/list", {
      layout: "admin-layout",
      admin: true,
      title: "Properties",
      isProperties: true,
      properties,
    });
  } catch (error) {
    console.error(error);
    res.render("admin/properties/list", {
      layout: "admin-layout",
      admin: true,
      title: "Properties",
      isProperties: true,
      error: "Failed to load properties",
    });
  }
});

// Add property form
router.get("/properties/add", verifyAdmin, (req, res) => {
  res.render("admin/properties/add", {
    layout: "admin-layout",
    admin: true,
    title: "Add Property",
    isProperties: true,
  });
});

// Add property route with multiple file uploads
router.post("/properties/add", verifyAdmin, upload.fields(uploadFields), async (req, res) => {
    try {
        // Get property images
        const propertyImages = req.files['images']?.map(
            file => `/uploads/properties/${file.filename}`
        ) || [];

        // Get floor plan images
        const floorPlanImages = req.files['floorPlanImages']?.map(
            file => `/uploads/floorplans/${file.filename}`
        ) || [];

        // Get brochure path
        const brochurePath = req.files['brochure'] ? 
            `/uploads/brochures/${req.files['brochure'][0].filename}` : null;

        const propertyData = {
            ...req.body,
            images: propertyImages,
            floorPlanImages,
            brochure: brochurePath,
            createdAt: new Date()
        };

        await propertyHelper.addProperty(propertyData);
        req.flash("success", "Property added successfully");
        res.redirect("/admin/properties");
    } catch (error) {
        console.error(error);
        // Delete uploaded files if there's an error
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                fs.unlink(file.path, err => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }
        req.flash("error", "Failed to add property");
        res.redirect("/admin/properties/add");
    }
});
// Add error handling middleware for multer errors
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let errorMessage = 'File upload error';
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                errorMessage = 'File is too large. Maximum size is 5MB';
                break;
            case 'LIMIT_FILE_COUNT':
                errorMessage = 'Too many files uploaded';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                errorMessage = 'Invalid file field';
                break;
        }
        req.flash("error", errorMessage);
        return res.redirect("/admin/properties/add");
    }
    next(err);
});
// Edit property form
router.get("/properties/edit/:id", verifyAdmin, async (req, res) => {
  try {
    const property = await propertyHelper.getPropertyById(req.params.id);
    if (!property) {
      req.flash("error", "Property not found");
      return res.redirect("/admin/properties");
    }
    res.render("admin/properties/edit", {
      layout: "admin-layout",
      admin: true,
      title: "Edit Property",
      isProperties: true,
      property,
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to load property");
    res.redirect("/admin/properties");
  }
});

router.post(
  "/properties/edit/:id",
  verifyAdmin,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "floorPlanImages", maxCount: 5 },
    { name: "brochure", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Handle property images
      const newImages =
        req.files["images"]?.map(
          (file) => `/uploads/properties/${file.filename}`
        ) || [];

      // Handle floor plan images
      const newFloorPlanImages =
        req.files["floorPlanImages"]?.map(
          (file) => `/uploads/floorplans/${file.filename}`
        ) || [];

      // Handle brochure
      const newBrochure = req.files["brochure"]
        ? `/uploads/brochures/${req.files["brochure"][0].filename}`
        : null;

      // Handle existing files
      const existingImages = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : typeof req.body.existingImages === "string"
        ? req.body.existingImages.split(",")
        : [];

      const existingFloorPlanImages = Array.isArray(req.body.existingFloorPlans)
        ? req.body.existingFloorPlans
        : typeof req.body.existingFloorPlans === "string"
        ? req.body.existingFloorPlans.split(",")
        : [];

      const existingBrochure = req.body.existingBrochure || null;

      // Handle removed files
      const removedImages = req.body.removedImages
        ? req.body.removedImages.split(",")
        : [];
      const removedFloorPlans = req.body.removedFloorPlans
        ? req.body.removedFloorPlans.split(",")
        : [];
      const removedBrochure = req.body.removedBrochure || null;

      // Filter out removed files
      const finalExistingImages = existingImages.filter(
        (img) => !removedImages.includes(img)
      );
      const finalExistingFloorPlans = existingFloorPlanImages.filter(
        (img) => !removedFloorPlans.includes(img)
      );
      const finalBrochure = removedBrochure
        ? null
        : newBrochure || existingBrochure;

      // Combine property data
      const propertyData = {
        ...req.body,
        images: [...finalExistingImages, ...newImages],
        floorPlanImages: [...finalExistingFloorPlans, ...newFloorPlanImages],
        brochure: finalBrochure,
        updatedAt: new Date(),
      };

      // Remove unnecessary fields
      delete propertyData.existingImages;
      delete propertyData.existingFloorPlans;
      delete propertyData.existingBrochure;
      delete propertyData.removedImages;
      delete propertyData.removedFloorPlans;
      delete propertyData.removedBrochure;

      // Update property
      await propertyHelper.updateProperty(req.params.id, propertyData);

      // Delete removed files from server
      [...removedImages, ...removedFloorPlans, removedBrochure]
        .filter(Boolean)
        .forEach((filePath) => {
          const fullPath = path.join(__dirname, "../public", filePath);
          fs.unlink(fullPath, (err) => {
            if (err) console.error(`Failed to delete file: ${fullPath}`, err);
          });
        });

      req.flash("success", "Property updated successfully");
      res.redirect("/admin/properties");
    } catch (error) {
      console.error(error);

      // Delete newly uploaded files if there's an error
      if (req.files) {
        Object.values(req.files)
          .flat()
          .forEach((file) => {
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting file:", err);
            });
          });
      }

      req.flash("error", "Failed to update property");
      res.redirect(`/admin/properties/edit/${req.params.id}`);
    }
  }
);
// Delete property
router.post("/properties/delete/:id", verifyAdmin, async (req, res) => {
  try {
    await propertyHelper.deleteProperty(req.params.id);
    req.flash("success", "Property deleted successfully");
    res.json({ status: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: false, message: "Failed to delete property" });
  }
});

// Add these routes to your admin.js routes file

// Enquiries list
router.get("/enquiries", verifyAdmin, async (req, res) => {
    try {
        const enquiries = await adminHelper.getAllEnquiries();
        res.render("admin/enquiries", {
            layout: "admin-layout",
            admin: true,
            title: "Enquiries",
            isEnquiries: true,
            enquiries
        });
    } catch (error) {
        console.error(error);
        res.render("admin/enquiries", {
            layout: "admin-layout",
            admin: true,
            title: "Enquiries",
            isEnquiries: true,
            error: "Failed to load enquiries"
        });
    }
});

// Get single enquiry details
router.get("/enquiries/:id", verifyAdmin, async (req, res) => {
    try {
        const enquiry = await adminHelper.getEnquiryById(req.params.id);
        if (!enquiry) {
            return res.status(404).json({ 
                success: false, 
                message: "Enquiry not found" 
            });
        }
        res.json({ success: true, enquiry });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to load enquiry details" 
        });
    }
});

// Update enquiry status
router.put("/enquiries/:id/status", verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const result = await adminHelper.updateEnquiryStatus(
            req.params.id, 
            status,
            { 
                updatedBy: req.session.admin._id,
                updatedAt: new Date()
            }
        );
        res.json({ success: true, message: "Status updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to update status" 
        });
    }
});

// Add note to enquiry
router.post("/enquiries/:id/notes", verifyAdmin, async (req, res) => {
    try {
        const { text } = req.body;
        const note = {
            text,
            addedBy: req.session.admin.username,
            createdAt: new Date()
        };
        const result = await adminHelper.addEnquiryNote(req.params.id, note);
        res.json({ success: true, message: "Note added successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to add note" 
        });
    }
});

// Delete enquiry
router.delete("/enquiries/:id", verifyAdmin, async (req, res) => {
    try {
        const result = await adminHelper.deleteEnquiry(req.params.id);
        res.json({ success: true, message: "Enquiry deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete enquiry" 
        });
    }
});

// Export selected enquiries
router.post("/enquiries/export", verifyAdmin, async (req, res) => {
    try {
        const { ids } = req.body;
        const enquiries = await adminHelper.getEnquiriesByIds(ids);
        res.json({ success: true, data: enquiries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to export enquiries" 
        });
    }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

module.exports = router;
