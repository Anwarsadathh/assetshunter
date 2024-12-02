// app.js

// Load environment variables
require("dotenv").config();

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("express-flash");
const exphbs = require("express-handlebars");
const db = require("./config/connection");
const propertyHelper = require("./helpers/property-helper");

var adminRouter = require("./routes/admin");
var usersRouter = require("./routes/users");

var app = express();

const hbs = exphbs.create({
  extname: "hbs",
  defaultLayout: "user-layout",
  layoutsDir: path.join(__dirname, "views/layout"),
  partialsDir: path.join(__dirname, "views/partials"),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
  helpers: {
    json: function (context) {
      return JSON.stringify(context);
    },
    increment: function (value) {
      return parseInt(value) + 1;
    },
    inc: function (value) {
      return parseInt(value) + 1;
    },
    eq: function (v1, v2) {
      return v1 === v2;
    },
    multiply: function (a, b) {
      return a * b;
    },
    divide: function (a, b) {
      return a / b;
    },
    formatDate: function (date) {
      return new Date(date).toLocaleDateString();
    },
    formatCurrency: function (value) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);
    },
    includes: function (array, value) {
      return Array.isArray(array) && array.includes(value);
    },
    gt: function (a, b) {
      return a > b;
    },
    lt: function (a, b) {
      return a < b;
    },
    gte: function (a, b) {
      return a >= b;
    },
    lte: function (a, b) {
      return a <= b;
    },
    and: function () {
      return Array.prototype.every.call(arguments, Boolean);
    },
    or: function () {
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    },
    not: function (value) {
      return !value;
    },
    getStatusColor: function (status) {
      switch (status?.toLowerCase()) {
        case "ready to move":
          return "success";
        case "under construction":
          return "warning";
        case "upcoming":
          return "info";
        case "sold out":
          return "danger";
        default:
          return "primary";
      }
    },
    slice: function (array, start, end) {
      if (!Array.isArray(array)) return [];
      return array.slice(start, end);
    },
    formatNumber: function (number) {
      return new Intl.NumberFormat("en-IN").format(number);
    },
    truncate: function (str, length) {
      if (str && str.length > length) {
        return str.substring(0, length) + "...";
      }
      return str;
    },
    add: function (a, b) {
      return a + b;
    },
    math: function (lvalue, operator, rvalue) {
      lvalue = parseFloat(lvalue);
      rvalue = parseFloat(rvalue);
      return {
        "+": lvalue + rvalue,
        "-": lvalue - rvalue,
        "*": lvalue * rvalue,
        "/": lvalue / rvalue,
        "%": lvalue % rvalue,
      }[operator];
    },
    getCurrentYear: function () {
      return new Date().getFullYear();
    },
    isArray: function (value) {
      return Array.isArray(value);
    },
    isEmpty: function (value) {
      return (
        !value ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "object" && Object.keys(value).length === 0)
      );
    },
    formatPrice: function (price) {
      if (price >= 10000000) {
        return (price / 10000000).toFixed(2) + " Cr";
      } else if (price >= 100000) {
        return (price / 100000).toFixed(2) + " L";
      } else {
        return "₹" + price.toLocaleString("en-IN");
      }
    },
    join: function (array, separator) {
      return Array.isArray(array) ? array.join(separator) : "";
    },
    lookup: function (obj, field) {
      return obj && obj[field];
    },
    each_upto: function (ary, max, options) {
      if (!ary || ary.length == 0) return options.inverse(this);

      var result = [];
      for (var i = 0; i < max && i < ary.length; ++i)
        result.push(options.fn(ary[i]));
      return result.join("");
    },
    // Add this to your helpers object
    length: function (value) {
      if (Array.isArray(value)) {
        return value.length;
      } else if (typeof value === "string") {
        return value.length;
      } else if (typeof value === "object" && value !== null) {
        return Object.keys(value).length;
      }
      return 0;
    },
    times: function (n, block) {
      var accum = "";
      for (var i = 0; i < Math.ceil(n); ++i) accum += block.fn(i);
      return accum;
    },
    ceil: function (value) {
      return Math.ceil(value);
    },
  },
});




// View engine setup
app.engine("hbs", hbs.engine);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

// Middleware setup
app.use(logger("dev"));

// Increase payload size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));
// Add middleware to include navigation data for all routes
app.use(async (req, res, next) => {
    try {
        const navData = await propertyHelper.getNavigationData();
        res.locals.navProjects = navData.navProjects;
        res.locals.navLocations = navData.navLocations;
        next();
    } catch (error) {
        console.error('Error loading navigation data:', error);
        next();
    }
});
// Initialize app (without starting server)
async function initializeApp() {
  try {
    // Connect to MongoDB
    await db.connectToServer();
    console.log("Database connected successfully");

    // Session middleware (after DB connection)
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "your-secret-key",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          client: db.getClient(),
          dbName: process.env.DB_NAME || "real_estate",
          collectionName: "sessions",
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
      })
    );

    // Flash middleware
    app.use(flash());

    // Add local variables middleware
    app.use((req, res, next) => {
      res.locals.user = req.session.user;
      res.locals.admin = req.session.admin;
      res.locals.success = req.flash("success");
      res.locals.error = req.flash("error");
      next();
    });

    // Routes
    app.use("/", usersRouter);
    app.use("/admin", adminRouter);

    // Catch 404 and forward to error handler
    app.use(function (req, res, next) {
      next(createError(404));
    });

    // Error handler
    app.use(function (err, req, res, next) {
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};
      res.status(err.status || 500);
      res.render("error", { layout: false });
    });
  } catch (err) {
    console.error("Failed to initialize application:", err);
    process.exit(1);
  }
}

// Initialize the application
initializeApp();

module.exports = app;
