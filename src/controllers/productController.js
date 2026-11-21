const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    sort = "-createdAt",
    page = 1,
    limit = 10
  } = req.query;

  const filter = {};

  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { sku: { $regex: safeSearch, $options: "i" } },
      { supplier: { $regex: safeSearch, $options: "i" } }
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    if (Object.values(filter.price).some((value) => Number.isNaN(value))) {
      return res.status(400).json({ success: false, message: "Price filters must be valid numbers" });
    }
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const allowedSortFields = ["name", "price", "quantity", "createdAt", "updatedAt", "category"];
  const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
  if (!allowedSortFields.includes(sortField)) {
    return res.status(400).json({
      success: false,
      message: `Invalid sort field. Allowed fields: ${allowedSortFields.join(", ")}`
    });
  }

  const sortOption = {};
  sortOption[sortField] = sort.startsWith("-") ? -1 : 1;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOption)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / pageSize),
    count: products.length,
    products
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.status(200).json({ success: true, product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "sku", "category", "price", "quantity", "reorderLevel", "supplier"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.status(200).json({ success: true, product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.status(200).json({ success: true, message: "Product deleted", id: product._id });
});

const adjustStock = asyncHandler(async (req, res) => {
  const change = Number(req.body.change);
  if (!Number.isInteger(change) || change === 0) {
    return res.status(400).json({
      success: false,
      message: "change must be a non-zero whole number (positive for restock, negative for sale)"
    });
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, quantity: { $gte: Math.max(0, -change) } },
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ success: false, message: "Product not found" });
    return res.status(400).json({ success: false, message: "Insufficient stock: quantity cannot become negative" });
  }

  res.status(200).json({ success: true, message: "Stock updated", product });
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.find({
    $expr: { $lte: ["$quantity", "$reorderLevel"] }
  }).sort({ quantity: 1 });

  res.status(200).json({
    success: true,
    count: lowStockItems.length,
    lowStockItems
  });
});

const getInventorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalStockValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        avgPrice: { $avg: "$price" }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        category: "$_id",
        totalItems: 1,
        totalQuantity: 1,
        totalStockValue: { $round: ["$totalStockValue", 2] },
        avgPrice: { $round: ["$avgPrice", 2] }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    categories: summary.length,
    summary
  });
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock,
  getLowStockProducts,
  getInventorySummary
};
