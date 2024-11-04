const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");
const passport = require("passport");
const cors = require("cors");
const session = require("express-session");
const flash = require("express-flash");
const compression = require("compression");
const initializePassport = require("./passportConfig");

//-------DATABASES IMPORTING-------//
const rhuPool = require("./models/rhudb");
const pharmacyPool = require("./models/pharmacydb");

//-------ROUTES--------//
const loginRouter = require("./routes/login/login");
const adminRouter = require("./routes/admin/admin");
const nurseRouter = require("./routes/nurse/nurse");
const doctorRouter = require("./routes/doctor/doctor");
const medtechRouter = require("./routes/medtech/medtech");
const pharmacyRouter = require("./routes/pharmacy/pharmacy");

//-------CONNECTING TO DATABASE-------//
Promise.all([
  rhuPool.connect().then(() => console.log("Connected to RHU database")),
  pharmacyPool.connect().then(() => console.log("Connected to PHARMACY database")),
]).catch((err) => console.error("Error connecting to database:", err));

initializePassport(passport);

//-------INITIALIZING VIEW ENGINE AND PATH------//
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
app.use("/uploads", express.static('uploads')); // Serve uploads directly

//-------MIDDLEWARE CONFIGURATION-------//
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());  
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production'},
}));
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

//------INITIALIZE ROUTES------//
app.use("/", loginRouter);
app.use("/", adminRouter);
app.use("/", nurseRouter);
app.use("/", doctorRouter);
app.use("/", medtechRouter);
app.use("/", pharmacyRouter);

app.get("/", (req, res) => {
  res.redirect("/user/login");
});

//------ERROR HANDLING-------//
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is up and running on port ${process.env.PORT}`);
});