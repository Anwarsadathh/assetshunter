// helpers/suggestion-helper.js

const { ObjectId } = require("mongodb");
const collection = require("../config/collection");
const db = require("../config/connection");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = {
  // Submit form data with validation
  submitFormDataSug: async (formData) => {
    try {
      const database = db.getDb();
      const enquiriesCollection = database.collection(
        collection.ENQUIRY_COLLECTION
      );

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return {
          success: false,
          message: "Please enter a valid email address",
        };
      }

      // Validate mobile number (assuming Indian format)
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(formData.mobile)) {
        return {
          success: false,
          message: "Please enter a valid 10-digit mobile number",
        };
      }

      // Check for duplicate enquiry within last 24 hours
      const lastDayEnquiry = await enquiriesCollection.findOne({
        email: formData.email,
        mobile: formData.mobile,
        propertyId: formData.propertyId,
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      });

      if (lastDayEnquiry) {
        return {
          success: false,
          message:
            "You have already submitted an enquiry for this property in the last 24 hours",
        };
      }

      // Add additional fields
      const enrichedFormData = {
        ...formData,
        status: "new",
        viewed: false,
        contactedAt: null,
        notes: [],
        source: "website",
        createdAt: new Date(),
      };

      // Insert enquiry
      const result = await enquiriesCollection.insertOne(enrichedFormData);

      // Send email notifications
      if (result.insertedId) {
        // Send confirmation to user
        await sendUserConfirmation(formData);

        // Send notification to admin
        await sendAdminNotification(formData);
      }

      return {
        success: true,
        insertedId: result.insertedId,
        message: "Thank you for your enquiry. We will contact you soon!",
      };
    } catch (error) {
      console.error("Error submitting form data:", error);
      return {
        success: false,
        message:
          "An error occurred while submitting your enquiry. Please try again.",
      };
    }
  },

  // Get user enquiries
  getUserEnquiries: async (email, mobile) => {
    try {
      const database = db.getDb();
      const enquiries = await database
        .collection(collection.ENQUIRY_COLLECTION)
        .find({
          $or: [{ email: email }, { mobile: mobile }],
        })
        .sort({ createdAt: -1 })
        .toArray();

      return {
        success: true,
        enquiries,
      };
    } catch (error) {
      console.error("Error fetching user enquiries:", error);
      return {
        success: false,
        message: "Failed to fetch enquiries",
      };
    }
  },

  // Subscribe to newsletter
  subscribeNewsletter: async (email) => {
    try {
      const database = db.getDb();

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: "Please enter a valid email address",
        };
      }

      // Check if already subscribed
      const existing = await database
        .collection(collection.NEWSLETTER_COLLECTION)
        .findOne({ email: email });

      if (existing) {
        return {
          success: false,
          message: "This email is already subscribed to our newsletter",
        };
      }

      // Add subscription
      await database.collection(collection.NEWSLETTER_COLLECTION).insertOne({
        email: email,
        subscribed: true,
        subscribedAt: new Date(),
      });

      // Send welcome email
      await sendNewsletterWelcome(email);

      return {
        success: true,
        message: "Successfully subscribed to newsletter!",
      };
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      return {
        success: false,
        message: "Failed to subscribe to newsletter",
      };
    }
  },

  // Save property
  saveProperty: async (userId, propertyId) => {
    try {
      const database = db.getDb();
      await database
        .collection(collection.USER_SAVED_PROPERTIES_COLLECTION)
        .insertOne({
          userId: new ObjectId(userId),
          propertyId: new ObjectId(propertyId),
          savedAt: new Date(),
        });

      return {
        success: true,
        message: "Property saved successfully",
      };
    } catch (error) {
      console.error("Error saving property:", error);
      return {
        success: false,
        message: "Failed to save property",
      };
    }
  },

  // Get saved properties
  getSavedProperties: async (userId) => {
    try {
      const database = db.getDb();
      const savedProperties = await database
        .collection(collection.USER_SAVED_PROPERTIES_COLLECTION)
        .aggregate([
          {
            $match: { userId: new ObjectId(userId) },
          },
          {
            $lookup: {
              from: collection.PROPERTY_COLLECTION,
              localField: "propertyId",
              foreignField: "_id",
              as: "property",
            },
          },
          {
            $unwind: "$property",
          },
          {
            $sort: { savedAt: -1 },
          },
        ])
        .toArray();

      return {
        success: true,
        properties: savedProperties,
      };
    } catch (error) {
      console.error("Error fetching saved properties:", error);
      return {
        success: false,
        message: "Failed to fetch saved properties",
      };
    }
  },
};

// Helper functions for sending emails
async function sendUserConfirmation(formData) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: formData.email,
      subject: "Thank you for your enquiry",
      html: `
                <h2>Thank you for your enquiry</h2>
                <p>Dear ${formData.name},</p>
                <p>We have received your enquiry about ${formData.propertyName}.</p>
                <p>Our team will contact you shortly.</p>
                <p>Your enquiry details:</p>
                <ul>
                    <li>Property: ${formData.propertyName}</li>
                    <li>Message: ${formData.message}</li>
                </ul>
                <p>Best regards,<br>Your Real Estate Team</p>
            `,
    });
  } catch (error) {
    console.error("Error sending user confirmation email:", error);
  }
}

async function sendAdminNotification(formData) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "New Property Enquiry",
      html: `
                <h2>New Property Enquiry</h2>
                <p>A new enquiry has been submitted:</p>
                <ul>
                    <li>Name: ${formData.name}</li>
                    <li>Email: ${formData.email}</li>
                    <li>Mobile: ${formData.mobile}</li>
                    <li>Property: ${formData.propertyName}</li>
                    <li>Message: ${formData.message}</li>
                </ul>
                <p><a href="${process.env.ADMIN_URL}/admin/enquiries">View in admin panel</a></p>
            `,
    });
  } catch (error) {
    console.error("Error sending admin notification email:", error);
  }
}

async function sendNewsletterWelcome(email) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Our Newsletter",
      html: `
                <h2>Welcome to Our Newsletter</h2>
                <p>Thank you for subscribing to our newsletter!</p>
                <p>You'll now receive updates about new properties, market insights, and exclusive offers.</p>
                <p>Best regards,<br>Your Real Estate Team</p>
            `,
    });
  } catch (error) {
    console.error("Error sending newsletter welcome email:", error);
  }
}
