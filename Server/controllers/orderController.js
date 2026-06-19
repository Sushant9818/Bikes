const { validateCartItems } = require('../services/inventoryService');

// POST /api/orders/validate-cart
// Body: { items: [{ productId, quantity, type: "bike"|"part" }] }
exports.validateCart = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Cart must contain at least one item',
      });
    }

    const summary = await validateCartItems(items);
    const allOk = summary.every((s) => s.ok);

    return res.status(200).json({
      ok: allOk,
      items: summary,
    });
  } catch (err) {
    return next(err);
  }
};

