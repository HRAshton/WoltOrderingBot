// @ts-check
"use strict";

import { getLogger } from '../LogManager.mjs';
import { MainRepository } from '../clients/MainRepository.mjs';
import { WoltApiClient } from '../clients/WoltApiClient.mjs';

const logger = getLogger('OrdersService');

/**
 * @param {MainRepository} mainRepository
 * @param {User[]} users
 * @param {string} text
 * @returns {Promise<{message: string, successful: boolean}>}
 */
export async function createOrderAndPrepareMessage(mainRepository, users, text) {
    const [settings, allPlaces, allItems] = await Promise.all([
        mainRepository.getSettingsAsync(),
        mainRepository.getPlacesAsync(),
        mainRepository.getItemsAsync(),
    ]);

    const { place, items, errorMessage } = _parseOrder(text, allPlaces, allItems, settings);
    if (!place || !items || errorMessage) {
        if (!errorMessage) throw new Error('No error message.');
        logger.warn(errorMessage);
        return { message: errorMessage, successful: false };
    }

    const woltClient = new WoltApiClient(
        settings.woltRefreshToken,
        mainRepository.setRefreshTokenAsync);

    logger.info('Creating order.');
    const order = await woltClient.createOrderAsync(
        place.alias,
        place.id,
        JSON.parse(settings.deliveryInfoStr));

    logger.info('Registering order.');
    // No need to await here.
    mainRepository.registerOrderAsync(order.id, new Date().toISOString());

    logger.info('Adding items.');
    const preparedItems = items.map(it => ({ itemId: it.item.itemId, count: it.count }));
    const added = await woltClient.addItemAsync(order.id, preparedItems);

    logger.info('Inviting users.');
    for (const user of users.filter(user => !!user.woltId)) {
        await woltClient.inviteUserAsync(order.id, user.woltId);
    }

    const itemsDescription = added
        ? items.map(it => `- ${it.item.fullName} x${it.count}`).join('\n')
        : 'Failed to add items.';
    const message = `
Order has been created.
Link: ${order.url}
Place: ${place.fullName}
Added items: ${items.length}
${itemsDescription}

The order will be deleted in ${settings.ordersExpirationMinutes} minutes.
  `;
    logger.info('Order has been created: %s.', message);
    return { message, successful: true };
}

/**
 * @param {string} text
 * @param {Place[]} allPlaces
 * @param {Item[]} allItems
 * @param {Settings} settings
 * @returns {{place?: Place, items?: {item: Item, count: number}[], errorMessage?: string}}
 */
function _parseOrder(text, allPlaces, allItems, settings) {
    const { place: fullTextPlace } = _findPlace([text], allPlaces);
    if (fullTextPlace) {
        logger.debug('Place found in full text: %s.', fullTextPlace);
        return { place: fullTextPlace, items: [] };
    }

    const tokens = text.split(' ');

    const { place, errorMessage } = _findPlace(tokens, allPlaces);
    if (!place) {
        if (!errorMessage) throw new Error('No error message.');
        logger.warn(errorMessage);
        return { errorMessage };
    }

    const items = _findItems(tokens, place, allItems);

    return { place, items };
}

/**
 * @param {string[]} tokens 
 * @param {Place[]} allPlaces 
 * @returns {{place?: Place, errorMessage?: string}} 
 */
function _findPlace(tokens, allPlaces) {
    const places = allPlaces
        .filter(place => tokens.includes(place.alias.toLocaleLowerCase())
            || tokens.includes(place.fullName.toLocaleLowerCase()));

    if (!places.length) {
        return { errorMessage: 'No places found.' };
    }

    if (places.length !== 1) {
        return { errorMessage: 'Too many places found.' };
    }

    logger.debug('Place found: %s.', places[0]);
    return { place: places[0] };
}

/**
 * @param {string[]} tokens
 * @param {Place} place
 * @param {Item[]} allItems
 * @returns {{item: Item, count: number}[]}
 */
function _findItems(tokens, place, allItems) {
    const placeItems = allItems.filter(item => item.placeId === place.id);
    const items = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const item = placeItems.find(item => item.itemAlias === token || item.fullName === token);
        if (!item) {
            continue;
        }

        let count = parseInt(tokens[i + 1]);
        if (isNaN(count)) {
            count = 1;
        }

        items.push({ item, count });
    }

    logger.debug('%s items found: %s.', items.length, items);
    return items;
}










