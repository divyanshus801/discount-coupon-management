const Joi = require('joi');

const cartValidationSchemas = {
  applyCart: Joi.object({
    cart: Joi.object({
      items: Joi.array()
        .items(
          Joi.object({
            product_id: Joi.required(),
            quantity: Joi.number().required().positive().integer(),
            price: Joi.number().required().positive(),
          })
        )
        .required()
        .min(1),
    }).required(),
    userId: Joi.string().optional(),
  }),
};

const validateCart = (schema) => (req, res, next) => {
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
  cartValidationSchemas,
  validateCart,
};
