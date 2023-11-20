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

/**
 * Language code.
 * @typedef {'en' | 'ka' | 'de' | 'fr' | 'ru'} LanguageCode
 */

/**
 * Search everywhere result.
 * @typedef {{sections: {items: SearchEverywhereResultItem[]}[]}} SearchEverywhereResult
 */

/**
 * Search everywhere result item.
 * @typedef {{title: string, venue: {id: string, product_line: string, slug: string}}} SearchEverywhereResultItem
 */

/**
 * Search in place result.
 * @typedef {{items: SearchInPlaceResultItem[]}} SearchInPlaceResult
 */

/**
 * Search in place result item.
 * @typedef {{id: string, image: string, name: string}} SearchInPlaceResultItem
 */
