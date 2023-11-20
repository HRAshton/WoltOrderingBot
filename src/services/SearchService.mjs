// @ts-check
/// <reference path="../typings/Types.js" />
"use strict";

import { getLogger } from "../LogManager.mjs";
import { WoltApiClient } from "../clients/WoltApiClient.mjs";

const logger = getLogger('SearchService');

/**
 * @param {MainRepository} mainRepository
 * @param {string} query
 * @returns {Promise<string[]>}
 */
export async function searchItemsEverywhereAsync(mainRepository, query) {
    logger.verbose('Searching for %s.', query);

    const settings = await mainRepository.getSettingsAsync();

    const woltClient = new WoltApiClient(
        settings.woltRefreshToken,
        mainRepository.setRefreshTokenAsync);

    const deliveryInfo = JSON.parse(settings.deliveryInfoStr);
    const [latitude, longitude] = deliveryInfo['location']['coordinates']['coordinates'];
    const items = await _searchItemsAsync(woltClient, query, latitude, longitude);
    if (!items?.length) {
        return [`No items found for ${query}.`];
    }

    logger.verbose('Found %d items for %s.', items.length, query);

    const message = _formatMessage(items);

    return message;
}

/**
 * @param {WoltApiClient} woltClient
 * @param {string} query
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{place: SearchEverywhereResultItem, items: SearchInPlaceResultItem[]}[]>}
 */
async function _searchItemsAsync(woltClient, query, latitude, longitude) {
    const places = await woltClient.searchEverywhereAsync(query, longitude, latitude);
    if (!places) {
        return [];
    }

    const allPlaces = places.sections.flatMap(section => section?.items || []);
    const topPlaces = allPlaces.slice(0, 5);

    const tasks = [];
    for (const place of topPlaces) {
        const task = woltClient.searchInPlaceAsync(query, place.venue.id, 'en');
        tasks.push({ place, task });
    }

    const results = await Promise.all(tasks.map(t => t.task));

    const itemsPerPlace = [];
    for (const [index, result] of results.entries()) {
        const { place } = tasks[index];
        const items = result?.items;
        if (!items?.length) {
            continue;
        }

        itemsPerPlace.push({ place, items });
    }

    return itemsPerPlace;
}

/**
 * @param {{place: SearchEverywhereResultItem, items: SearchInPlaceResultItem[]}[]} itemsPerPlace
 * @returns {string[]}
 */
function _formatMessage(itemsPerPlace) {
    const lines = [];

    const orderedPlaces = itemsPerPlace.sort((a, b) => a.place.title.localeCompare(b.place.title));
    for (const { place, items: placeItems } of orderedPlaces) {
        const placeUrl = `https://wolt.com/en/geo/tbilisi/${place.venue.product_line}/${place.venue.slug}`;
        const placeLine = `*${place.title}* [link 🛒](${placeUrl})`;
        lines.push(placeLine);

        const orderedItems = placeItems.sort((a, b) => a.name.localeCompare(b.name));
        for (const item of orderedItems) {
            const itemLine = `- ${item.name} [image 🖼](${item.image})`;
            lines.push(itemLine);
        }

        lines.push('');
    }

    return lines;
}
