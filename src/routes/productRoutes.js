const express = require("express");
const controller = require("../controllers/productController");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.route("/low-stock").get(controller.getLowStockProducts);
router.route("/summary").get(controller.getInventorySummary);
router.route("/").post(controller.createProduct).get(controller.getProducts);
router.route("/:id/stock").patch(validateObjectId, controller.adjustStock);
router.route("/:id")
  .get(validateObjectId, controller.getProductById)
  .put(validateObjectId, controller.updateProduct)
  .delete(validateObjectId, controller.deleteProduct);

module.exports = router;
