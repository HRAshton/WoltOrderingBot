// @ts-check
/// <reference path="../typings/Types.js" />
"use strict";

import fetch from 'node-fetch';
import { getLogger } from "../LogManager.mjs";
import { REFRESH_TOKENS_INTERVAL_SECS } from "../lowLevelConfiguration.mjs";

const logger = getLogger('WoltApiClient');

export class WoltApiClient {
    /** @type {string} */
    _refreshToken;

    /** @type {(refreshToken: string) => Promise<void>} */
    _setRefreshTokenCallback;

    /** @type {string | null} */
    _accessToken;

    /** @type {Date | null} */
    _nextAccessTokenUpdate;

    /**
     * @param {string} refreshToken
     * @param {(refreshToken: string) => Promise<void>} setRefreshTokenCallback
     */
    constructor(refreshToken, setRefreshTokenCallback) {
        this._refreshToken = refreshToken;
        this._setRefreshTokenCallback = setRefreshTokenCallback;
        this._accessTokenLastUpdated = null;

        if (!setRefreshTokenCallback) {
            throw Error('setRefreshTokenCallback must be set.');
        }

        this.createOrderAsync = this.createOrderAsync.bind(this);
        this.addItemAsync = this.addItemAsync.bind(this);
        this.inviteUserAsync = this.inviteUserAsync.bind(this);
        this.deleteOrderAsync = this.deleteOrderAsync.bind(this);
        this.updateRefreshTokenAsync = this.updateRefreshTokenAsync.bind(this);
        logger.verbose('WoltApiClient created.');
    }

    /**
     * @param {string} orderName
     * @param {string} placeId
     * @param {Object} delivaryInfo
     * @returns {Promise<DetailedOrder>}
     */
    async createOrderAsync(orderName, placeId, delivaryInfo) {
        logger.debug('Creating order %s.', orderName);

        const payload = {
            name: orderName,
            venue_id: placeId,
            emoji: "electronics",
            delivery_method: "homedelivery",
            delivery_info: delivaryInfo,
        };

        const order = await this._sendRequestAsync('POST', '/group_order/', payload);

        logger.info('Created order %s with id=%s', orderName, order.id);
        return order;
    }

    /**
     * @param {string} orderId
     * @param {{itemId: string, count: number}[]} items
     * @returns {Promise<boolean>}
     */
    async addItemAsync(orderId, items) {
        logger.verbose('Adding items %s to order %s.', JSON.stringify(items), orderId);

        try {
            const payload = {
                items: items.map(item => ({
                    "id": item.itemId,
                    "count": item.count,
                    "baseprice": 0,
                    "options": [],
                    "end_amount": 0,
                    "checksum": ""
                })),
            };

            await this._sendRequestAsync('PATCH', `/group_order/${orderId}/participants/me/basket`, payload);
        } catch (e) {
            logger.warn(e);
            return false;
        }

        logger.info('Added items %o to order %s.', JSON.stringify(items), orderId);
        return true;
    }

    /**
     * @param {string} orderId
     * @param {string} userId
     * @returns {Promise<void>}
     */
    async inviteUserAsync(orderId, userId) {
        logger.verbose('Inviting user %s to order %s.', userId, orderId);

        try {
            await this._sendRequestAsync('POST', `/group_order/${orderId}/invite/${userId}`, null);
        } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') {
                // The request returns 204 No Content, so we get an error here.
                logger.error('Error while inviting user %s to order %s: %o.', userId, orderId, e);
            }
        }

        logger.info('Invited user %s to order %s.', userId, orderId);
    }

    /**
     * @param {string} orderId
     * @returns {Promise<void>}
     */
    async deleteOrderAsync(orderId) {
        logger.verbose('Deleting order %s.', orderId);

        try {
            await this._sendRequestAsync('DELETE', `/group_order/${orderId}`, null);
            logger.info('Deleted order %s.', orderId);
        } catch (e) {
            logger.info('Unable to delete order %s: %o.', orderId, e);
        }
    }

    /** @returns {Promise<void>} */
    async updateRefreshTokenAsync() {
        logger.verbose('Updating refresh token.');
        this._accessToken = null;
        await this._authorizeAsync();
        logger.info('Updated refresh token.');
    }

    /**
     * @param {string} httpMethod
     * @param {string} relativeUrl
     * @param {Object} payload
     * @returns {Promise<Object>}
     * @private
     */
    async _sendRequestAsync(httpMethod, relativeUrl, payload) {
        await this._authorizeAsync();

        const options = {
            method: httpMethod,
            headers: {
                'Authorization': `Bearer ${this._accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }

        const url = `https://restaurant-api.wolt.com/v1${relativeUrl}`;
        logger.debug('Sending request to %s.', url);
        logger.debug('Body: %o.', options);

        let textResponse;
        let result;
        try {
            const response = await fetch(url, options);
            textResponse = await response.text();
            result = JSON.parse(textResponse);
        } catch (e) {
            logger.warn('Error while sending request: %s.', e);
            logger.warn(textResponse);
            throw e;
        }

        if (result['error_code']) {
            throw Error(`Error while sending request: ${result['error_code']}: ${result['msg']}`);
        }

        return result;
    }

    /**
     * @returns {Promise<void>}
     * */
    async _authorizeAsync() {
        if (this._accessToken && this._nextAccessTokenUpdate && new Date() < this._nextAccessTokenUpdate) {
            return;
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'grant_type': 'refresh_token',
                'refresh_token': this._refreshToken,
            }),
        }

        const url = 'https://authentication.wolt.com/v1/wauth2/access_token';
        logger.debug('Sending request to %s.', url);
        logger.debug('%o', options);

        const response = await fetch(url, options);
        const result = await response.json();
        if (!result) {
            throw Error('Error while authorizing: no result.');
        }

        if (result['error_code']) {
            throw Error(`Error while authorizing: ${result['error_code']}: ${result['msg']}`);
        }

        if (result['refresh_token'] && result['refresh_token'] !== this._refreshToken) {
            logger.verbose('Setting new refresh token: %s...', result['refresh_token'].slice(0, 10));
            this._refreshToken = result['refresh_token'];

            // No need to await here.
            this._setRefreshTokenCallback(result['refresh_token']);
        }

        this._accessToken = result['access_token'];
        this._nextAccessTokenUpdate = new Date(new Date().getTime() + REFRESH_TOKENS_INTERVAL_SECS * 1000);
        logger.verbose('Access token updated: %s...', this._accessToken?.slice(0, 10));
        logger.verbose('Next access token update: %s.', this._nextAccessTokenUpdate.toISOString());
    }
}
