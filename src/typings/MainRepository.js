/// <reference path="./Types.js" />

/**
 * @typedef {Object} IMainRepository
 *
 * @property {() => Promise<Settings>} getSettingsAsync - Asynchronously retrieves settings from the database.
 * @property {() => Promise<Place[]>} getPlacesAsync - Asynchronously retrieves a list of places from the database.
 * @property {() => Promise<Item[]>} getItemsAsync - Asynchronously retrieves a list of items from the database.
 * @property {() => Promise<User[]>} getUsersAsync - Asynchronously retrieves a list of users from the database.
 *
 * @property {() => Promise<RegisteredOrder[]>} getOrdersAsync - Asynchronously retrieves a list of orders to delete from the database.
 * @property {(orderId: string, createdAt: string) => Promise<void>} registerOrderAsync - Asynchronously registers an order to be deleted in the database.
 * @property {(orderId: string) => Promise<void>} deleteOrderAsync - Asynchronously deletes an order from the database.
 *
 * @property {(refreshToken: string) => Promise<void>} setRefreshTokenAsync - Asynchronously sets a new refresh token in the database.
 * @property {() => Promise<void>} refreshCache - Asynchronously refreshes all data in the cache.
 */
