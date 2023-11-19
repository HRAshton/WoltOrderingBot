// @ts-check
/// <reference path="../typings/Types.js" />
"use strict";

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { getLogger } from '../LogManager.mjs';
import { DATABASE_PATH } from '../lowLevelConfiguration.mjs';

const logger = getLogger('MainRepository');

export class MainRepository {
  /** @type {Database} */
  _db;

  constructor() {
    this.getSettingsAsync = this.getSettingsAsync.bind(this);
    this.setRefreshTokenAsync = this.setRefreshTokenAsync.bind(this);
    this.registerOrderToDeleteAsync = this.registerOrderAsync.bind(this);
    this.deleteOrderAsync = this.deleteOrderAsync.bind(this);
    logger.verbose('MainRepository created.');
  }

  /** @returns {Promise<Settings>} */
  async getSettingsAsync() {
    await this._initDatabaseAsync();
    const settings = await this._db.all('SELECT * FROM Settings');
    const result = Object.fromEntries(settings.map(setting => [setting.name, setting.value]));

    logger.verbose('Returning settings: %o.', result);
    return result;
  }

  /** @returns {Promise<Place[]>} */
  async getPlacesAsync() {
    await this._initDatabaseAsync();
    const result = await this._db.all('SELECT * FROM Places');

    logger.verbose('Returning places: %o.', result);
    return result;
  }

  /** @returns {Promise<Item[]>} */
  async getItemsAsync() {
    await this._initDatabaseAsync();
    const result = await this._db.all('SELECT * FROM Items');

    logger.verbose('Returning items: %o.', result);
    return result;
  }

  /** @returns {Promise<User[]>} */
  async getUsersAsync() {
    await this._initDatabaseAsync();
    const result = await this._db.all('SELECT * FROM Users');

    logger.verbose('Returning users: %o.', result);
    return result;
  }

  /** @returns {Promise<RegisteredOrder[]>} */
  async getOrdersAsync() {
    await this._initDatabaseAsync();
    const result = await this._db.all('SELECT * FROM OrdersToDelete');

    logger.verbose('Returning orders: %o.', result);
    return result;
  }

  /**
   * @param {string} refreshToken 
   * @returns {Promise<void>}
   */
  async setRefreshTokenAsync(refreshToken) {
    await this._initDatabaseAsync();
    await this._db.run('UPDATE Settings SET value = ? WHERE name = ?', [refreshToken, 'woltRefreshToken']);
    logger.verbose('Refresh token updated.');
  }

  /**
   * @param {string} orderId
   * @param {string} createdAt
   * @returns {Promise<void>}
   */
  async registerOrderAsync(orderId, createdAt) {
    await this._initDatabaseAsync();
    await this._db.run('INSERT INTO OrdersToDelete (orderId, createdAt) VALUES (?, ?)', [orderId, createdAt]);
    logger.verbose('Order %s registered.', orderId);
  }

  /**
   * @param {string} orderId
   * @returns {Promise<void>}
   */
  async deleteOrderAsync(orderId) {
    await this._initDatabaseAsync();
    await this._db.run('DELETE FROM OrdersToDelete WHERE orderId = ?', [orderId]);
    logger.verbose('Order %s deleted.', orderId);
  }

  /** @private */
  async _initDatabaseAsync() {
    if (this._db) {
      return;
    }

    this._db = await open({
      filename: DATABASE_PATH,
      driver: sqlite3.Database
    });

    this._db.on('trace', (/** @type {string} */ sql) => logger.debug(sql));

    await this._createDatabaseAsync();
  }

  /** @private */
  async _createDatabaseAsync() {
    await this._db.exec(`
      CREATE TABLE IF NOT EXISTS Settings (
        name TEXT PRIMARY KEY,
        value TEXT
      )`);

    await this._db.exec(`
      CREATE TABLE IF NOT EXISTS Places (
        alias TEXT PRIMARY KEY,
        fullName TEXT,
        id TEXT
      )`);

    await this._db.exec(`
      CREATE TABLE IF NOT EXISTS Items (
        placeId TEXT NOT NULL,
        itemAlias TEXT NOT NULL,
        itemId	TEXT NOT NULL,
        fullName TEXT NOT NULL
      )`);

    await this._db.exec(`
      CREATE TABLE IF NOT EXISTS Users (
        telegramId INTEGER PRIMARY KEY,
        woltId TEXT,
        alias TEXT
      )`);

    await this._db.exec(`
      CREATE TABLE IF NOT EXISTS OrdersToDelete (
        orderId TEXT PRIMARY KEY,
        createdAt TEXT
      )`);

    await this._db.exec(`
      INSERT OR IGNORE INTO Settings (name, value)
        VALUES ('woltRefreshToken', 'COPY _wrtoken FROM COOKIE HERE'),
               ('deliveryInfoStr', 'COPY delivery_info STRING FROM A WOLT REQUEST HERE'),
               ('telegramToken', 'COPY TELEGRAM TOKEN HERE'),
               ('ordersExpirationMinutes', '15')`);
    
    logger.verbose('Migration complete.');
  }
}
