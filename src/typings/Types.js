/**
 * User.
 * @typedef {{telegramId: number, woltId: string, alias: string}} User
 */

/**
 * Place.
 * @typedef {{id: string, alias: string, fullName: string}} Place
 */

/**
 * Item.
 * @typedef {{placeId: string, itemId: string, itemAlias: string, fullName: string}} Item
 */

/**
 * Registered order.
 * @typedef {{orderId: string, createdAt: string}} RegisteredOrder
 */

/**
 * Detailed order.
 * @typedef {{id: string, url: string}} DetailedOrder
 */

/**
 * Settings.
 * @typedef {{woltRefreshToken: string, deliveryInfoStr: string, telegramToken: string, ordersExpirationMinutes: number}} Settings
 */
