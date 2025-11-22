
const router = require('express').Router();
const { createCoupon, getCoupons, getCouponById, updateCoupon, deleteCoupon, getApplicableCoupons, applyCoupon, getCouponStats } = require('../controllers/coupon.controller');
const { validateCoupon, couponValidationSchemas } = require('../validators/couponValidators');
const { validateCart, cartValidationSchemas } = require('../validators/cartValidators');

// CRUD endpoints
router.post('/coupons', validateCoupon(couponValidationSchemas.createCoupon), createCoupon);
router.get('/coupons', getCoupons);
router.get('/coupons/:id', getCouponById);
router.put('/coupons/:id', validateCoupon(couponValidationSchemas.updateCoupon), updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Discount endpoints
router.post('/applicable-coupons', validateCart(cartValidationSchemas.applyCart), getApplicableCoupons);
router.post('/apply-coupon/:id', validateCart(cartValidationSchemas.applyCart), applyCoupon);

// Stats endpoint
router.get('/coupons/:id/stats', getCouponStats);

module.exports = router;
