// routes/admin.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const propertyHelper = require("../helpers/property-helper");
const adminHelper = require("../helpers/admin-helper");

// Multer configuration for different types of uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "public/uploads/properties";
    if (file.fieldname === "floorPlanImages") {
      uploadPath = "public/uploads/floorplans";
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

// Configure multer with file validation and limits
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload an image."), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 15, // Total files limit (10 property images + 5 floor plans)
  },
});

// Define upload fields
const uploadFields = [
  { name: "images", maxCount: 10 },
  { name: "floorPlanImages", maxCount: 5 },
];

// Admin authentication middleware
const verifyAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

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

        const propertyData = {
            ...req.body,
            images: propertyImages,
            floorPlanImages,
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
        { name: 'images', maxCount: 10 },
        { name: 'floorPlanImages', maxCount: 5 }
    ]),
    async (req, res) => {
        try {
            // Handle property images
            const newImages = req.files['images']?.map(
                file => `/uploads/properties/${file.filename}`
            ) || [];

            // Handle floor plan images
            const newFloorPlanImages = req.files['floorPlanImages']?.map(
                file => `/uploads/floorplans/${file.filename}`
            ) || [];

            // Handle existing property images
            const existingImages = Array.isArray(req.body.existingImages)
                ? req.body.existingImages
                : typeof req.body.existingImages === "string"
                ? req.body.existingImages.split(",")
                : [];

            // Handle existing floor plan images
            const existingFloorPlanImages = Array.isArray(req.body.existingFloorPlans)
                ? req.body.existingFloorPlans
                : typeof req.body.existingFloorPlans === "string"
                ? req.body.existingFloorPlans.split(",")
                : [];

            // Handle removed images and floor plans
            const removedImages = req.body.removedImages ? req.body.removedImages.split(',') : [];
            const removedFloorPlans = req.body.removedFloorPlans ? req.body.removedFloorPlans.split(',') : [];

            // Filter out removed images and floor plans
            const finalExistingImages = existingImages.filter(img => !removedImages.includes(img));
            const finalExistingFloorPlans = existingFloorPlanImages.filter(img => !removedFloorPlans.includes(img));

            // Combine property data
            const propertyData = {
                ...req.body,
                images: [...finalExistingImages, ...newImages],
                floorPlanImages: [...finalExistingFloorPlans, ...newFloorPlanImages],
                updatedAt: new Date()
            };

            // Remove unnecessary fields
            delete propertyData.existingImages;
            delete propertyData.existingFloorPlans;
            delete propertyData.removedImages;
            delete propertyData.removedFloorPlans;

            // Update property
            await propertyHelper.updateProperty(req.params.id, propertyData);

            // Delete removed files from server
            [...removedImages, ...removedFloorPlans].forEach(filePath => {
                const fullPath = path.join(__dirname, '../public', filePath);
                fs.unlink(fullPath, err => {
                    if (err) console.error(`Failed to delete file: ${fullPath}`, err);
                });
            });

            req.flash("success", "Property updated successfully");
            res.redirect("/admin/properties");
        } catch (error) {
            console.error(error);
            
            // Delete newly uploaded files if there's an error
            if (req.files) {
                Object.values(req.files).flat().forEach(file => {
                    fs.unlink(file.path, err => {
                        if (err) console.error('Error deleting file:', err);
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
