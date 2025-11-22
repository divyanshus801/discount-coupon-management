const CouponService = require('../services/couponService');

const createCoupon = async (req, res, next) => {
  try {
    const { code, type, details, description, expiryDate, usageLimit, maxDiscount, minCartValue } = req.body;


    const coupon = await CouponService.createCoupon({
      code,
      type,
      details,
      description,
      expiryDate,
      usageLimit,
      maxDiscount,
      minCartValue,
    });

    res.status(201).json({
      success: true,
      data: coupon,
      message: 'Coupon created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getCoupons = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;

    const coupons = await CouponService.getAllCoupons(includeInactive === 'true');

    res.json({
      success: true,
      data: coupons,
      count: coupons.length,
    });
  } catch (error) {
    next(error);
  }
};

const getCouponById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await CouponService.getCouponById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found',
      });
    }

    res.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const coupon = await CouponService.updateCoupon(id, updateData);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found',
      });
    }

    res.json({
      success: true,
      data: coupon,
      message: 'Coupon updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await CouponService.deleteCoupon(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found',
      });
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getApplicableCoupons = async (req, res, next) => {
  try {
    const { cart, userId } = req.body;

    if (!cart || !cart.items) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cart format',
      });
    }

    const applicableCoupons = await CouponService.getApplicableCoupons(cart, userId);

    res.json({
      success: true,
      data: {
        applicableCoupons,
        count: applicableCoupons.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cart, userId } = req.body;

    if (!cart || !cart.items) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cart format',
      });
    }

    const result = await CouponService.applyCoupon(id, cart, userId);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const getCouponStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const stats = await CouponService.getCouponStats(id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found',
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  getApplicableCoupons,
  applyCoupon,
  getCouponStats,
};
