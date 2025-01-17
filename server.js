const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");
const passport = require("passport");
const cors = require("cors");
const session = require("express-session");
const flash = require("express-flash");
const compression = require("compression");
const initializePassport = require("./src/config/passportConfig");
const bodyParser = require("body-parser");
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf } = format;

//-------LOGGER CONFIGURATION-------//
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
  level: "info",
  format: combine(timestamp(), logFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(__dirname, "logs", "app.log") }),
  ],
});

console.log = logger.info.bind(logger);
console.error = logger.error.bind(logger);

//-------DATABASES IMPORTING-------//
const rhuPool = require("./src/config/rhudb");
const pharmacyPool = require("./src/config/pharmacydb");

//-------CONNECTING TO DATABASE-------//
Promise.all([
  rhuPool.connect().then(() => logger.info("Connected to RHU database")),
  pharmacyPool.connect().then(() => logger.info("Connected to PHARMACY database")),
]).catch((err) => logger.error("Error connecting to database:", err));

initializePassport(passport);

//-------INITIALIZING VIEW ENGINE AND PATH------//
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
app.use("/uploads", express.static("uploads"));

//-------MIDDLEWARE CONFIGURATION-------//
app.use(compression());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//-------CACHE CONTROL-------//
app.use((req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
});

//-------ROUTES--------//
const routes = require("./src/routes");
app.use("/", routes);

app.get("/", (req, res) => {
  res.redirect("/user/login");
});

//------ERROR HANDLING-------//
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send("Something broke!");
});

const server = app.listen(process.env.PORT, () => {
  logger.info(`Server is up and running on port ${process.env.PORT}`);
});

//-------GRACEFUL SHUTDOWN-------//
process.on("SIGINT", () => {
  logger.info("Shutting down server...");
  server.close(() => {
    rhuPool.end();
    pharmacyPool.end();
    logger.info("Server and database connections closed.");
    process.exit(0);
  });
});