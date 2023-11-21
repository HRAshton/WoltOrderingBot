// @ts-check
/// <reference path="../typings/Types.js" />
/// <reference path="../typings/MainRepository.js" />
"use strict";

import fetch from 'node-fetch';
import { getLogger } from '../LogManager.mjs';
import { GAS_DB_ENDPOINT } from '../lowLevelConfiguration.mjs';
import { SimpleCache } from '../helpers/SimpleCache.mjs';

const logger = getLogger('GoogleSheetsRepository');

let initialized = false;

/** @implements {IMainRepository} */
export class GoogleSheetsRepository {
  endpoint = GAS_DB_ENDPOINT || '';
  cache = new SimpleCache();

  constructor() {
    if (initialized) {
      throw new Error('GoogleSheetsRepository already initialized. Please reuse the instance.');
    }

    if (!this.endpoint) {
      throw new Error('GAS_DB_ENDPOINT must be set.');
    }

    initialized = true;

    this.getSettingsAsync = this.getSettingsAsync.bind(this);
    this.getPlacesAsync = this.getPlacesAsync.bind(this);
    this.getItemsAsync = this.getItemsAsync.bind(this);
    this.getUsersAsync = this.getUsersAsync.bind(this);
    this.getOrdersAsync = this.getOrdersAsync.bind(this);
    this.setRefreshTokenAsync = this.setRefreshTokenAsync.bind(this);
    this.registerOrderAsync = this.registerOrderAsync.bind(this);
    this.deleteOrderAsync = this.deleteOrderAsync.bind(this);
    this.refreshCache = this.refreshCache.bind(this);
    logger.verbose('GoogleSheetsRepository created.');
  }

  /** @returns {Promise<Settings>} */
  async getSettingsAsync() {
    const result = await this.cache.getOrCreateAsync(
      'getSettings',
      async () => await this._callDatabaseAsync('getSettings'));

    logger.verbose('Returning settings: %o.', result);
    return result;
  }

  /** @returns {Promise<Place[]>} */
  async getPlacesAsync() {
    const result = await this.cache.getOrCreateAsync(
      'getPlaces',
      async () => await this._callDatabaseAsync('getPlaces'));

    logger.verbose('Returning places: %o.', result);
    return result;
  }

  /** @returns {Promise<Item[]>} */
  async getItemsAsync() {
    const result = await this.cache.getOrCreateAsync(
      'getItems',
      async () => await this._callDatabaseAsync('getItems'));

    logger.verbose('Returning items: %o.', result);
    return result;
  }

  /** @returns {Promise<User[]>} */
  async getUsersAsync() {
    const result = await this.cache.getOrCreateAsync(
      'getUsers',
      async () => await this._callDatabaseAsync('getUsers'));

    logger.verbose('Returning users: %o.', result);
    return result;
  }

  /** @returns {Promise<RegisteredOrder[]>} */
  async getOrdersAsync() {
    const result = await this._callDatabaseAsync('getOrders');

    logger.verbose('Returning orders: %o.', result);
    return result;
  }

  /**
   * @param {string} woltRefreshToken 
   * @returns {Promise<void>}
   */
  async setRefreshTokenAsync(woltRefreshToken) {
    await this._callDatabaseAsync('setRefreshToken', { woltRefreshToken });
    this.cache.clear();
    logger.verbose('Refresh token updated.');
  }

  /**
   * @param {string} orderId
   * @param {string} createdAt
   * @returns {Promise<void>}
   */
  async registerOrderAsync(orderId, createdAt) {
    await this._callDatabaseAsync('registerOrder', { orderId, createdAt });
    logger.verbose('Order %s registered.', orderId);
  }

  /**
   * @param {string} orderId
   * @returns {Promise<void>}
   */
  async deleteOrderAsync(orderId) {
    await this._callDatabaseAsync('deleteOrder', { orderId });
    logger.verbose('Order %s deleted.', orderId);
  }

  /** @returns {Promise<void>} */
  async refreshCache() {
    this.cache.clear();
    logger.verbose('Cache cleared.');

    await Promise.all([
      this.getSettingsAsync(),
      this.getPlacesAsync(),
      this.getItemsAsync(),
      this.getUsersAsync(),
    ]);
    logger.verbose('Cache refreshed.');
  }

  /**
   * @param {string} method
   * @param {object} params
   * @returns {Promise<any>}
   */
  async _callDatabaseAsync(method, params = {}) {
    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ method, params }),
    };

    logger.debug('Calling Google Sheets API with options: %o.', options);

    const response = await fetch(this.endpoint, options);
    const responseText = await response.text();
    logger.debug('Google Sheets API returned: %s.', responseText);

    const result = JSON.parse(responseText || '{}');
    logger.debug('Google Sheets API returned: %o.', result);

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  }
}
