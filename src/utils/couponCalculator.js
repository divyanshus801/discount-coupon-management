
const logger = require('../config/logger');

// Calculate cart-wise discount
const calculateCartWise = (cart, coupon) => {
  try {
    const threshold = coupon.details.threshold || 0;
    const discountPercent = coupon.details.discount || 0;
    const cartTotal = getCartTotal(cart);

    if (cartTotal < threshold) {
      return { discount: 0, applicable: false };
    }

    const discount = Math.round((cartTotal * discountPercent) / 100 * 100) / 100;
    const maxDiscount = coupon.maxDiscount ? parseFloat(coupon.maxDiscount) : Infinity;
    const finalDiscount = Math.min(discount, maxDiscount);

    return {
      discount: finalDiscount,
      applicable: true,
      reason: `Cart total ${cartTotal} >= threshold ${threshold}`,
    };
  } catch (error) {
    logger.error('Error calculating cart-wise discount:', error);
    return { discount: 0, applicable: false, error: error.message };
  }
};

// Calculate product-wise discount
const calculateProductWise = (cart, coupon) => {
  try {
    const targetProduct = coupon.details.product_id;
    const discountPercent = coupon.details.discount || 0;

    let discount = 0;
    const applicableItems = [];

    for (const item of cart.items) {
      if (String(item.product_id) === String(targetProduct)) {
        const itemDiscount = Math.round((item.price * item.quantity * discountPercent) / 100 * 100) / 100;
        discount += itemDiscount;
        applicableItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          itemDiscount,
        });
      }
    }

    if (applicableItems.length === 0) {
      return { discount: 0, applicable: false, reason: `Product ${targetProduct} not in cart` };
    }

    const maxDiscount = coupon.maxDiscount ? parseFloat(coupon.maxDiscount) : Infinity;
    const finalDiscount = Math.min(discount, maxDiscount);

    return {
      discount: finalDiscount,
      applicable: true,
      applicableItems,
    };
  } catch (error) {
    logger.error('Error calculating product-wise discount:', error);
    return { discount: 0, applicable: false, error: error.message };
  }
};

// Calculate BxGy (Buy X Get Y) discount
const calculateBxGy = (cart, coupon) => {
  try {
    const buyProducts = coupon.details.buy_products || [];
    const getProducts = coupon.details.get_products || [];
    const repetitionLimit = coupon.details.repition_limit || 1;

    if (!buyProducts.length || !getProducts.length) {
      return { discount: 0, applicable: false, reason: 'Invalid BxGy configuration' };
    }

    let minQualifyingBatches = Infinity;

    for (const buyItem of buyProducts) {
      const cartItem = cart.items.find(i => String(i.product_id) === String(buyItem.product_id));
      const availableQty = cartItem ? cartItem.quantity : 0;
      const requiredQty = buyItem.quantity || 1;
      const qualifyingBatches = Math.floor(availableQty / requiredQty);
      minQualifyingBatches = Math.min(minQualifyingBatches, qualifyingBatches);
    }

    const applicableTimes = Math.min(minQualifyingBatches, repetitionLimit);

    if (applicableTimes === 0 || minQualifyingBatches === Infinity) {
      return {
        discount: 0,
        applicable: false,
        reason: 'Cart does not have enough items from buy set',
      };
    }

    let discount = 0;
    const freeItems = [];

    for (const getItem of getProducts) {
      const cartItem = cart.items.find(i => String(i.product_id) === String(getItem.product_id));

      if (cartItem) {
        const freeQuantity = (getItem.quantity || 1) * applicableTimes;
        const itemPrice = parseFloat(cartItem.price);
        const itemDiscount = freeQuantity * itemPrice;

        discount += itemDiscount;
        freeItems.push({
          product_id: getItem.product_id,
          freeQuantity,
          unitPrice: itemPrice,
          itemDiscount: Math.round(itemDiscount * 100) / 100,
        });
      }
    }

    const maxDiscount = coupon.maxDiscount ? parseFloat(coupon.maxDiscount) : Infinity;
    const finalDiscount = Math.min(discount, maxDiscount);

    return {
      discount: Math.round(finalDiscount * 100) / 100,
      applicable: true,
      applicableTimes,
      freeItems,
    };
  } catch (error) {
    logger.error('Error calculating BxGy discount:', error);
    return { discount: 0, applicable: false, error: error.message };
  }
};

// Distribute discount to individual items based on coupon type
const distributeDiscount = (items, discountInfo, couponType) => {
  const updatedItems = items.map(item => ({ ...item, totalDiscount: 0 }));

  if (couponType === 'product-wise' && discountInfo.applicableItems) {
    for (const applicable of discountInfo.applicableItems) {
      const idx = updatedItems.findIndex(it => String(it.product_id) === String(applicable.product_id));
      if (idx !== -1) {
        updatedItems[idx].totalDiscount = applicable.itemDiscount;
      }
    }
  } else if (couponType === 'bxgy' && discountInfo.freeItems) {
    for (const free of discountInfo.freeItems) {
      const idx = updatedItems.findIndex(it => String(it.product_id) === String(free.product_id));
      if (idx !== -1) {
        updatedItems[idx].quantity += free.freeQuantity;
        updatedItems[idx].totalDiscount = free.itemDiscount;
      }
    }
  } else if (couponType === 'cart-wise') {
    const cartSubtotal = updatedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0) || 1;
    const totalDiscount = discountInfo.discount;

    for (const item of updatedItems) {
      const itemSubtotal = item.price * item.quantity;
      item.totalDiscount = Math.round((itemSubtotal / cartSubtotal) * totalDiscount * 100) / 100;
    }
  }

  return updatedItems;
};

// Apply coupon to cart and return updated cart
const applyToCart = (cart, coupon) => {
  try {
    const couponType = coupon.type;
    let discountInfo;

    if (couponType === 'cart-wise') {
      discountInfo = calculateCartWise(cart, coupon);
    } else if (couponType === 'product-wise') {
      discountInfo = calculateProductWise(cart, coupon);
    } else if (couponType === 'bxgy') {
      discountInfo = calculateBxGy(cart, coupon);
    } else {
      return { error: `Unknown coupon type: ${couponType}` };
    }

    if (!discountInfo.applicable) {
      return { error: discountInfo.reason || 'Coupon not applicable' };
    }

    const cartTotal = getCartTotal(cart);
    const totalDiscount = discountInfo.discount;
    const finalPrice = Math.max(0, cartTotal - totalDiscount);

    const updatedItems = distributeDiscount(cart.items, discountInfo, couponType);

    return {
      success: true,
      updatedCart: {
        items: updatedItems,
        originalTotal: cartTotal,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        finalPrice: Math.round(finalPrice * 100) / 100,
        couponApplied: {
          id: coupon.id,
          code: coupon.code,
          type: couponType,
        },
      },
    };
  } catch (error) {
    logger.error('Error applying coupon to cart:', error);
    return { error: error.message };
  }
};

// Get total value of cart
const getCartTotal = (cart) => {
  return cart.items.reduce((sum, item) => {
    return sum + (parseFloat(item.price) * parseInt(item.quantity));
  }, 0);
};

module.exports = {
  calculateCartWise,
  calculateProductWise,
  calculateBxGy,
  applyToCart,
  distributeDiscount,
  getCartTotal,
};