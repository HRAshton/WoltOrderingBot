// @ts-check
"use strict";

export class SimpleCache {
    cache = new Map();

    /**
     * @template T
     * @param {string} key
     * @param {() => Promise<T>} getValueCallback
     * @returns {Promise<T>}
     */
    async getOrCreateAsync(key, getValueCallback) {
        if (!this.cache.has(key)) {
            const value = await getValueCallback();
            this.cache.set(key, value);
        }

        return this.cache.get(key);
    }

    /** @returns {void} */
    clear() {
        this.cache = new Map();
    }
}