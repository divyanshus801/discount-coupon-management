require('dotenv').config();

const { Coupon } = require('../models');
const logger = require('../config/logger');
const sequelize = require('../config/database');

const sampleCoupons = [
  {
    code: 'WELCOME10',
    type: 'cart-wise',
    details: { threshold: 500, discount: 10 },
    description: '10% off on orders over Rs. 500',
    maxDiscount: 200,
    isActive: true,
  },
  {
    code: 'SPECIAL20',
    type: 'product-wise',
    details: { product_id: 1, discount: 20 },
    description: '20% off on Product ID 1',
    maxDiscount: 500,
    isActive: true,
  },
  {
    code: 'B2G1',
    type: 'bxgy',
    details: {
      buy_products: [{ product_id: 2, quantity: 2 }],
      get_products: [{ product_id: 3, quantity: 1 }],
      repition_limit: 3,
    },
    description: 'Buy 2 from Product 2, Get 1 Product 3 Free',
    isActive: true,
  },
  {
    code: 'FESTIVE15',
    type: 'cart-wise',
    details: { threshold: 1000, discount: 15 },
    description: '15% off on orders over Rs. 1000 (Festive)',
    maxDiscount: 500,
    expiryDate: new Date('2025-12-31'),
    usageLimit: 500,
    isActive: true,
  },
];

/**
 * Seed database with sample coupons for testing
 */
async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    await sequelize.sync({ alter: false });
    logger.info('✓ Database synchronized');

    await Coupon.destroy({ where: {} });
    logger.info('✓ Cleared existing coupons');

    await Coupon.bulkCreate(sampleCoupons);
    logger.info(`✓ Created ${sampleCoupons.length} sample coupons`);

    logger.info('✓ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
