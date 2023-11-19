// @ts-check
/// <reference path="../typings/Types.js" />
/// <reference path="../typings/MainRepository.js" />
"use strict";

import { getLogger } from '../LogManager.mjs';
import { GAS_DB_ENDPOINT } from '../lowLevelConfiguration.mjs';

const logger = getLogger('GoogleSheetsRepository');

/** @implements {MainRepository} */
export class GoogleSheetsRepository {
  constructor() {
    this.getSettingsAsync = this.getSettingsAsync.bind(this);
    this.getPlacesAsync = this.getPlacesAsync.bind(this);
    this.getItemsAsync = this.getItemsAsync.bind(this);
    this.getUsersAsync = this.getUsersAsync.bind(this);
    this.getOrdersAsync = this.getOrdersAsync.bind(this);
    this.setRefreshTokenAsync = this.setRefreshTokenAsync.bind(this);
    this.registerOrderAsync = this.registerOrderAsync.bind(this);
    this.deleteOrderAsync = this.deleteOrderAsync.bind(this);
    logger.verbose('GoogleSheetsRepository created.');
  }

  /** @returns {Promise<Settings>} */
  async getSettingsAsync() {
    const result = await this._callDatabaseAsync('getSettings');

    logger.verbose('Returning settings: %o.', result);
    return result;
  }

  /** @returns {Promise<Place[]>} */
  async getPlacesAsync() {
    const result = await this._callDatabaseAsync('getPlaces');

    logger.verbose('Returning places: %o.', result);
    return result;
  }

  /** @returns {Promise<Item[]>} */
  async getItemsAsync() {
    const result = await this._callDatabaseAsync('getItems');

    logger.verbose('Returning items: %o.', result);
    return result;
  }

  /** @returns {Promise<User[]>} */
  async getUsersAsync() {
    const result = await this._callDatabaseAsync('getUsers');

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

    const response = await fetch(GAS_DB_ENDPOINT, options);
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
