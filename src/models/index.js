const Coupon = require('./Coupon');
const CouponUsage = require('./CouponUsage');

// Set up associations
Coupon.hasMany(CouponUsage, {
  foreignKey: 'couponId',
  as: 'usages',
});

CouponUsage.belongsTo(Coupon, {
  foreignKey: 'couponId',
  as: 'coupon',
});

module.exports = {
  Coupon,
  CouponUsage,
};
