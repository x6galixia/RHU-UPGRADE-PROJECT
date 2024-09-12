const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const flash = require("express-flash");

//-------ROUTES--------//
const adminRouter = require("./routes/admin/admin");
const pharmacyRouter = require("./routes/pharmacy/inventory");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
app.use(cors());

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(flash());

app.use((req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
});

//-----REDIRECT TO PAGE PREVIEW-----//
//-----this is just for initial setup-----//
//-----for production the url should be redirected to the login-----//
app.get("/pharmacy", (req, res) => {
  res.redirect("/pharmacy/inventory");
});

//------INITIALIZE ROUTES------//
app.use("/", adminRouter);
app.use("/", pharmacyRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is up and running on port ${process.env.PORT}`);
});
