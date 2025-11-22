
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Coupon = sequelize.define(
  'Coupon',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('cart-wise', 'product-wise', 'bxgy'),
      allowNull: false,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Global usage limit',
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    perUserLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Usage limit per user',
    },
    minCartValue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    maxDiscount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.STRING,
      defaultValue: 'admin',
    },
  },
  {
    tableName: 'coupons',
    timestamps: true,
    indexes: [
      { fields: ['code'] },
      { fields: ['type'] },
      { fields: ['is_active'] },
      { fields: ['expiry_date'] },
    ],
  }
);

module.exports = Coupon;
