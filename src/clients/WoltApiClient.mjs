// @ts-check
/// <reference path="../typings/Types.js" />
"use strict";

export class WoltApiClient {
    /** @type {string} */
    _refreshToken;

    /** @type {(refreshToken: string) => Promise<void>} */
    _setRefreshTokenCallback;

    /** @type {string} */
    _accessToken;

    /**
     * @param {string} refreshToken
     * @param {(refreshToken: string) => Promise<void>} setRefreshTokenCallback
     */
    constructor(refreshToken, setRefreshTokenCallback) {
        this._refreshToken = refreshToken;
        this._setRefreshTokenCallback = setRefreshTokenCallback;
        this.accessToken = null;

        if (!setRefreshTokenCallback) {
            throw Error('setRefreshTokenCallback must be set.');
        }

        this.createOrderAsync = this.createOrderAsync.bind(this);
        this.addItemAsync = this.addItemAsync.bind(this);
        this.inviteUserAsync = this.inviteUserAsync.bind(this);
        this.deleteOrderAsync = this.deleteOrderAsync.bind(this);
        this.updateRefreshTokenAsync = this.updateRefreshTokenAsync.bind(this);
    }

    /**
     * @param {string} orderName
     * @param {string} placeId
     * @param {Object} delivaryInfo
     * @returns {Promise<DetailedOrder>}
     */
    async createOrderAsync(orderName, placeId, delivaryInfo) {
        console.log('Creating order %s.', orderName);

        const payload = {
            name: orderName,
            venue_id: placeId,
            emoji: "electronics",
            delivery_method: "homedelivery",
            delivery_info: delivaryInfo,
        };

        const order = await this._sendRequestAsync('POST', '/group_order/', payload);

        console.log('Created order %s with id=%s', orderName, order.id);
        return order;
    }

    /**
     * @param {string} orderId
     * @param {{itemId: string, count: number}[]} items
     * @returns {Promise<boolean>}
     */
    async addItemAsync(orderId, items) {
        console.log('Adding items %s to order %s.', JSON.stringify(items), orderId);

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
            console.error(e);
            return false;
        }

        console.log('Added items %s to order %s.', JSON.stringify(items), orderId);
        return true;
    }

    /**
     * @param {string} orderId
     * @param {string} userId
     * @returns {Promise<void>}
     */
    async inviteUserAsync(orderId, userId) {
        console.log('Inviting user %s to order %s.', userId, orderId);

        try {
            await this._sendRequestAsync('POST', `/group_order/${orderId}/invite/${userId}`, null);
        } catch (e) {
            console.error(e);
        }

        console.log('Invited user %s to order %s.', userId, orderId);
    }

    /**
     * @param {string} orderId
     * @returns {Promise<void>}
     */
    async deleteOrderAsync(orderId) {
        console.log('Deleting order %s.', orderId);

        try {
            await this._sendRequestAsync('DELETE', `/group_order/${orderId}`, null);
        } catch (e) {
            console.error(e);
        }

        console.log('Deleted order %s.', orderId);
    }

    /** @returns {Promise<void>} */
    async updateRefreshTokenAsync() {
        console.log('Updating refresh token.');
        await this._authorizeAsync(true);
        console.log('Updated refresh token.');
    }

    /**
     * @param {string} httpMethod
     * @param {string} relativeUrl
     * @param {Object} payload
     * @returns {Promise<Object>}
     * @private
     */
    async _sendRequestAsync(httpMethod, relativeUrl, payload) {
        await this._authorizeAsync(false);

        const options = {
            method: httpMethod,
            headers: {
                'Authorization': `Bearer ${this._accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }

        console.log(JSON.stringify(options));
        console.log('https://restaurant-api.wolt.com/v1' + relativeUrl);

        let textResponse;
        let result;
        try {
            const response = await fetch('https://restaurant-api.wolt.com/v1' + relativeUrl, options);
            textResponse = await response.text();
            result = JSON.parse(textResponse || '{}');
        } catch (e) {
            console.error('Error while sending request: %s.', e);
            console.error(textResponse);
            throw e;
        }

        if (result['error_code']) {
            throw Error(`Error while sending request: ${result['error_code']}: ${result['msg']}`);
        }

        return result;
    }

    /**
     * @param {boolean} force
     * @returns {Promise<void>}
     * */
    async _authorizeAsync(force) {
        if (this._accessToken && !force) {
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

        const response = await fetch('https://authentication.wolt.com/v1/wauth2/access_token', options);
        const result = await response.json();
        if (result['error_code']) {
            throw Error(`Error while authorizing: ${result['error_code']}: ${result['msg']}`);
        }

        if (result['refresh_token'] && result['refresh_token'] !== this._refreshToken) {
            console.log('Setting new refresh token: %s.', result['refresh_token'].slice(0, 10));
            this._refreshToken = result['refresh_token'];
            await this._setRefreshTokenCallback(result['refresh_token']);
        }

        console.log('Setting new access token: %s.', result['access_token'].slice(0, 10));
        this._accessToken = result['access_token'];
    }
}
