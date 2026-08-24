const USER_ROLES = Object.freeze({
  CUSTOMER: "customer",
  RESTAURANT: "restaurant",
  DELIVERY: "delivery",
  ADMIN: "admin",
});

const APPROVAL_STATUS = Object.freeze({
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
});

const ORDER_STATUS = Object.freeze({
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY: "READY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
});

const PAYMENT_METHOD = Object.freeze({
  COD: "COD",
  ONLINE: "ONLINE",
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
});

const VEHICLE_TYPE = Object.freeze({
  BIKE: "BIKE",
  SCOOTER: "SCOOTER",
  BICYCLE: "BICYCLE",
});

const DISCOUNT_TYPE = Object.freeze({
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
});

module.exports = {
  USER_ROLES,
  APPROVAL_STATUS,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  VEHICLE_TYPE,
  DISCOUNT_TYPE,
};