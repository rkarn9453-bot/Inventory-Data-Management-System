const express = require("express");
const productRoutes = require("./routes/productRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Inventory and Data Management System API",
    endpoints: {
      products: "/api/products",
      lowStock: "/api/products/low-stock",
      summary: "/api/products/summary"
    }
  });
});

app.use("/api/products", productRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
