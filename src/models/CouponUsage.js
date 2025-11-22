const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const CouponUsage = sequelize.define(
  'CouponUsage',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    couponId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'coupons',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User who redeemed the coupon',
    },
    cartTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    discountApplied: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Associated order ID',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional context like applied items',
    },
  },
  {
    tableName: 'coupon_usages',
    timestamps: true,
    indexes: [
      { fields: ['coupon_id'] },
      { fields: ['user_id'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = CouponUsage;
