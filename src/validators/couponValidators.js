const Joi = require('joi');

const couponValidationSchemas = {
  createCoupon: Joi.object({
    code: Joi.string().required().min(3).max(50).alphanum(),
    type: Joi.string().required().valid('cart-wise', 'product-wise', 'bxgy'),
    details: Joi.object().required(),
    description: Joi.string().optional().max(500),
    expiryDate: Joi.date().optional(),
    usageLimit: Joi.number().optional().integer().positive(),
    perUserLimit: Joi.number().optional().integer().positive(),
    minCartValue: Joi.number().optional().greater(-1),
    maxDiscount: Joi.number().optional().positive(),
  }),

  updateCoupon: Joi.object({
    code: Joi.string().optional().min(3).max(50).alphanum(),
    type: Joi.string().optional().valid('cart-wise', 'product-wise', 'bxgy'),
    details: Joi.object().optional(),
    description: Joi.string().optional().max(500),
    isActive: Joi.boolean().optional(),
    expiryDate: Joi.date().optional(),
    usageLimit: Joi.number().optional().integer().positive(),
    perUserLimit: Joi.number().optional().integer().positive(),
    minCartValue: Joi.number().optional().greater(-1),
    maxDiscount: Joi.number().optional().positive(),
  }).min(1),

  cartWiseDetails: Joi.object({
    threshold: Joi.number().required().positive(),
    discount: Joi.number().required().greater(0).max(100),
  }),

  productWiseDetails: Joi.object({
    product_id: Joi.required(),
    discount: Joi.number().required().greater(0).max(100),
  }),

  bxgyDetails: Joi.object({
    buy_products: Joi.array()
      .items(
        Joi.object({
          product_id: Joi.required(),
          quantity: Joi.number().required().positive(),
        })
      )
      .required()
      .min(1),
    get_products: Joi.array()
      .items(
        Joi.object({
          product_id: Joi.required(),
          quantity: Joi.number().required().positive(),
        })
      )
      .required()
      .min(1),
    repition_limit: Joi.number().required().positive().integer(),
  }),
};

const validateCoupon = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
  }

  req.validatedBody = value;
  next();
};

module.exports = {
  couponValidationSchemas,
  validateCoupon,
};
