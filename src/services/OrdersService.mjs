// @ts-check
"use strict";

import { MainRepository } from '../clients/MainRepository.mjs';
import { WoltApiClient } from '../clients/WoltApiClient.mjs';

/**
 * @param {MainRepository} mainRepository
 * @param {User[]} users
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function createOrderAndPrepareMessage(mainRepository, users, text) {
    const settings = await mainRepository.getSettingsAsync();
    const allPlaces = await mainRepository.getPlacesAsync();
    const allItems = await mainRepository.getItemsAsync();

    const tokens = text.split(' ');

    const { place, errorMessage } = _findPlace(tokens, allPlaces);
    if (!!errorMessage || !place) {
        console.error(errorMessage);
        return errorMessage || 'Unknown error.';
    }

    const items = _findItems(tokens, place, allItems);

    const woltClient = new WoltApiClient(
        settings.woltRefreshToken,
        mainRepository.setRefreshTokenAsync);

    console.log('Creating order.');
    const order = await woltClient.createOrderAsync(
        place.alias,
        place.id,
        JSON.parse(settings.deliveryInfoStr));

    console.log('Registering order.');
    await mainRepository.registerOrderAsync(order.id, new Date().toISOString());

    console.log('Adding items.');
    const preparedItems = items.map(it => ({ itemId: it.item.itemId, count: it.count }));
    const added = await woltClient.addItemAsync(order.id, preparedItems);

    console.log('Inviting users.');
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
    console.log('Order has been created: %s.', message);
    return message;
}

/**
 * @param {string[]} tokens 
 * @param {Place[]} allPlaces 
 * @returns {{place?: Place, errorMessage?: string}} 
 */
function _findPlace(tokens, allPlaces) {
    const places = allPlaces
        .filter(place => tokens.includes(place.alias) || tokens.includes(place.fullName));

    if (!places.length) {
        return { errorMessage: 'No places found.' };
    }

    if (places.length !== 1) {
        return { errorMessage: 'Too many places found.' };
    }

    console.log('Place found: %s.', places[0]);
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

    console.log('%s items found: %s.', items.length, items);
    return items;
}










