const DiscountEngine = require('../utils/couponCalculator');

describe('DiscountEngine', () => {
  describe('calculateCartWise', () => {
    it('should apply discount when cart total >= threshold', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 2, price: 50 },
          { product_id: 2, quantity: 1, price: 60 },
        ],
      };

      const coupon = {
        details: { threshold: 100, discount: 10 },
        maxDiscount: null,
      };

      const result = DiscountEngine.calculateCartWise(cart, coupon);

      expect(result.applicable).toBe(true);
      expect(result.discount).toBe(16); // 10% of 160
    });

    it('should not apply discount when cart total < threshold', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 1, price: 50 },
        ],
      };

      const coupon = {
        details: { threshold: 100, discount: 10 },
        maxDiscount: null,
      };

      const result = DiscountEngine.calculateCartWise(cart, coupon);

      expect(result.applicable).toBe(false);
      expect(result.discount).toBe(0);
    });

    it('should apply max discount cap if specified', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 10, price: 50 },
        ],
      };

      const coupon = {
        details: { threshold: 100, discount: 10 },
        maxDiscount: 20,
      };

      const result = DiscountEngine.calculateCartWise(cart, coupon);

      expect(result.applicable).toBe(true);
      expect(result.discount).toBe(20); // capped at maxDiscount
    });
  });

  describe('calculateProductWise', () => {
    it('should apply discount to matching product', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 2, price: 50 },
          { product_id: 2, quantity: 1, price: 60 },
        ],
      };

      const coupon = {
        details: { product_id: 1, discount: 20 },
        maxDiscount: null,
      };

      const result = DiscountEngine.calculateProductWise(cart, coupon);

      expect(result.applicable).toBe(true);
      expect(result.discount).toBe(20); // 20% of (50*2)
      expect(result.applicableItems.length).toBe(1);
    });

    it('should not apply discount when product not in cart', () => {
      const cart = {
        items: [
          { product_id: 2, quantity: 1, price: 60 },
        ],
      };

      const coupon = {
        details: { product_id: 1, discount: 20 },
        maxDiscount: null,
      };

      const result = DiscountEngine.calculateProductWise(cart, coupon);

      expect(result.applicable).toBe(false);
    });
  });

  describe('calculateBxGy', () => {
    it('should apply BxGy when conditions are met', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 6, price: 50 },
          { product_id: 3, quantity: 2, price: 25 },
        ],
      };

      const coupon = {
        details: {
          buy_products: [{ product_id: 1, quantity: 2 }],
          get_products: [{ product_id: 3, quantity: 1 }],
          repition_limit: 3,
        },
        maxDiscount: null,
      };

      const result = DiscountEngine.calculateBxGy(cart, coupon);

      expect(result.applicable).toBe(true);
      expect(result.applicableTimes).toBe(3);
      expect(result.discount).toBeGreaterThan(0);
    });

    it('should not apply BxGy when buy condition not met', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 1, price: 50 },
          { product_id: 3, quantity: 2, price: 25 },
        ],
      };

      const coupon = {
        details: {
          buy_products: [{ product_id: 1, quantity: 2 }],
          get_products: [{ product_id: 3, quantity: 1 }],
          repition_limit: 3,
        },
        maxDiscount: null,
      };

      const result = DiscountEngine.calculateBxGy(cart, coupon);

      expect(result.applicable).toBe(false);
    });

    it('should respect repetition limit', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 10, price: 50 },
          { product_id: 3, quantity: 10, price: 25 },
        ],
      };

      const coupon = {
        details: {
          buy_products: [{ product_id: 1, quantity: 2 }],
          get_products: [{ product_id: 3, quantity: 1 }],
          repition_limit: 2,
        },
        maxDiscount: null,
      };

      const result = DiscountEngine.calculateBxGy(cart, coupon);

      expect(result.applicable).toBe(true);
      expect(result.applicableTimes).toBe(2); // limited by repition_limit
    });
  });

  describe('getCartTotal', () => {
    it('should calculate cart total correctly', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 2, price: 50 },
          { product_id: 2, quantity: 1, price: 100 },
        ],
      };

      const total = DiscountEngine.getCartTotal(cart);

      expect(total).toBe(200); // 2*50 + 1*100
    });

    it('should return 0 for empty cart', () => {
      const cart = { items: [] };

      const total = DiscountEngine.getCartTotal(cart);

      expect(total).toBe(0);
    });
  });

  describe('applyToCart', () => {
    it('should apply coupon and return updated cart', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 2, price: 50 },
        ],
      };

      const coupon = {
        id: '1',
        code: 'CART10',
        type: 'cart-wise',
        details: { threshold: 50, discount: 10 },
        maxDiscount: null,
      };

      const result = DiscountEngine.applyToCart(cart, coupon);

      expect(result.success).toBe(true);
      expect(result.updatedCart.totalDiscount).toBeGreaterThan(0);
      expect(result.updatedCart.finalPrice).toBeLessThan(result.updatedCart.originalTotal);
    });

    it('should return error if coupon not applicable', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 1, price: 10 },
        ],
      };

      const coupon = {
        id: '1',
        code: 'CART100',
        type: 'cart-wise',
        details: { threshold: 1000, discount: 10 },
        maxDiscount: null,
      };

      const result = DiscountEngine.applyToCart(cart, coupon);

      expect(result.error).toBeDefined();
      expect(result.success).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle decimal prices correctly', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 3, price: 33.33 },
        ],
      };

      const coupon = {
        details: { threshold: 99, discount: 10 },
        maxDiscount: null,
      };

      const result = DiscountEngine.calculateCartWise(cart, coupon);

      expect(result.applicable).toBe(true);
      expect(typeof result.discount).toBe('number');
    });

    it('should handle zero quantity items', () => {
      const cart = {
        items: [
          { product_id: 1, quantity: 0, price: 50 },
          { product_id: 2, quantity: 2, price: 50 },
        ],
      };

      const total = DiscountEngine.getCartTotal(cart);

      expect(total).toBe(100);
    });
  });
});
