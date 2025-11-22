const { Coupon, CouponUsage } = require('../models');
const { calculateCartWise, calculateProductWise, calculateBxGy, applyToCart, getCartTotal } = require('../utils/couponCalculator');
const logger = require('../config/logger');
const { Op } = require('sequelize');

// ==================== VALIDATION HELPERS ====================

const validateCouponCodeUniqueness = async (code, excludeId = null) => {
  const where = { code: code.toUpperCase() };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  const existingCoupon = await Coupon.findOne({ where });
  if (existingCoupon) {
    throw new Error('Coupon code already exists. Please use a different code.');
  }
};

// ==================== CRUD OPERATIONS ====================

const createCoupon = async (data) => {
  try {
    // Check for duplicate coupon code
    await validateCouponCodeUniqueness(data.code);

    const coupon = await Coupon.create({
      code: data.code.toUpperCase(),
      type: data.type,
      details: data.details,
      isActive: data.isActive !== false,
      expiryDate: data.expiryDate,
      usageLimit: data.usageLimit,
      minCartValue: data.minCartValue || 0,
      maxDiscount: data.maxDiscount,
      description: data.description,
      createdBy: data.createdBy || 'admin',
    });

    logger.info(`✓ Coupon created: ${coupon.id}`);
    return coupon;
  } catch (error) {
    logger.error('Error creating coupon:', error);
    throw error;
  }
};

const getAllCoupons = async (includeInactive = false) => {
  try {
    const where = {};
    if (!includeInactive) {
      where.isActive = true;
      where.expiryDate = { [Op.or]: [null, { [Op.gt]: new Date() }] };
    }

    const coupons = await Coupon.findAll({ where });

    logger.info(`✓ Retrieved ${coupons.length} coupons`);
    return coupons;
  } catch (error) {
    logger.error('Error fetching all coupons:', error);
    throw error;
  }
};

const getCouponById = async (id) => {
  try {
    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return null;
    }

    return coupon;
  } catch (error) {
    logger.error('Error fetching coupon:', error);
    throw error;
  }
};

const getCouponByCode = async (code) => {
  try {
    const coupon = await Coupon.findOne({ where: { code } });

    if (!coupon) {
      return null;
    }

    return coupon;
  } catch (error) {
    logger.error('Error fetching coupon by code:', error);
    throw error;
  }
};

const updateCoupon = async (id, data) => {
  try {
    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      const error = new Error('Coupon not found');
      error.status = 404;
      throw error;
    }

    // Check for duplicate coupon code if code is being changed
    if (data.code && data.code.toUpperCase() !== coupon.code) {
      await validateCouponCodeUniqueness(data.code, id);
      data.code = data.code.toUpperCase();
    }

    await coupon.update(data);

    logger.info(`✓ Coupon updated: ${id}`);
    return coupon;
  } catch (error) {
    logger.error('Error updating coupon:', error);
    throw error;
  }
};

const deleteCoupon = async (id) => {
  try {
    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      const error = new Error('Coupon not found');
      error.status = 404;
      throw error;
    }

    await coupon.destroy();

    logger.info(`✓ Coupon deleted: ${id}`);
    return true;
  } catch (error) {
    logger.error('Error deleting coupon:', error);
    throw error;
  }
};

const getApplicableCoupons = async (cart, userId = null) => {
  try {
    const coupons = await getAllCoupons(false);
    const applicableCoupons = [];

    for (const coupon of coupons) {
      const cartTotal = getCartTotal(cart);
      if (cartTotal < parseFloat(coupon.minCartValue)) {
        continue;
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        continue;
      }

      let discountInfo;
      if (coupon.type === 'cart-wise') {
        discountInfo = calculateCartWise(cart, coupon);
      } else if (coupon.type === 'product-wise') {
        discountInfo = calculateProductWise(cart, coupon);
      } else if (coupon.type === 'bxgy') {
        discountInfo = calculateBxGy(cart, coupon);
      }

      if (discountInfo.applicable && discountInfo.discount > 0) {
        applicableCoupons.push({
          coupon_id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          discount: discountInfo.discount,
          description: coupon.description,
        });
      }
    }

    logger.info(`✓ Found ${applicableCoupons.length} applicable coupons`);
    return applicableCoupons;
  } catch (error) {
    logger.error('Error getting applicable coupons:', error);
    throw error;
  }
};

const applyCoupon = async (couponId, cart, userId = null) => {
  try {
    const coupon = await getCouponById(couponId);

    if (!coupon) {
      const error = new Error('Coupon not found');
      error.status = 404;
      throw error;
    }

    if (!coupon.isActive) {
      const error = new Error('Coupon is not active');
      error.status = 400;
      throw error;
    }

    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      const error = new Error('Coupon has expired');
      error.status = 400;
      throw error;
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      const error = new Error('Coupon usage limit reached');
      error.status = 400;
      throw error;
    }

    const cartTotal = getCartTotal(cart);
    if (cartTotal < parseFloat(coupon.minCartValue)) {
      const error = new Error(`Cart total must be at least ${coupon.minCartValue}`);
      error.status = 400;
      throw error;
    }

    const result = applyToCart(cart, coupon);

    if (result.error) {
      const error = new Error(result.error);
      error.status = 400;
      throw error;
    }

    const finalCartTotal = getCartTotal(cart);
    await CouponUsage.create({
      couponId: coupon.id,
      userId,
      cartTotal: finalCartTotal,
      discountApplied: result.updatedCart.totalDiscount,
    });

    await coupon.increment('usageCount');

    logger.info(`✓ Coupon ${coupon.id} applied for user ${userId || 'guest'}`);
    return result;
  } catch (error) {
    logger.error('Error applying coupon:', error);
    throw error;
  }
};

const getCouponStats = async (couponId) => {
  try {
    const coupon = await getCouponById(couponId);

    if (!coupon) {
      const error = new Error('Coupon not found');
      error.status = 404;
      throw error;
    }

    const usages = await CouponUsage.findAll({
      where: { couponId },
    });

    const totalRedeemed = usages.reduce((sum, usage) => sum + parseFloat(usage.discountApplied), 0);

    return {
      coupon,
      totalUsages: usages.length,
      totalDiscountGiven: totalRedeemed,
      averageDiscount: usages.length > 0 ? totalRedeemed / usages.length : 0,
    };
  } catch (error) {
    logger.error('Error getting coupon stats:', error);
    throw error;
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
  getApplicableCoupons,
  applyCoupon,
  getCouponStats,
};
