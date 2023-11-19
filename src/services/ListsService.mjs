// @ts-check
/// <reference path="../typings/Types.js" />
"use strict";

import { MainRepository } from "../clients/MainRepository.mjs";

/**
 * @param {MainRepository} mainRepository
 * @returns {Promise<string[]>}
 */
export async function getListsAsync(mainRepository) {
    const places = await mainRepository.getPlacesAsync();
    const items = await mainRepository.getItemsAsync();

    let placesMessage = `Places (${places.length}):`;
    const itemsMessages = [];

    const placeIds = new Set(places.map(it => it.id));
    for (const placeId of placeIds) {
        const samePlaces = places.filter(it => it.id === placeId);

        placesMessage += `\n- ${samePlaces[0].fullName} (${samePlaces.map(it => it.alias).join(', ')})`;

        let itemsMessage = `Items of ${samePlaces[0].fullName}:`
        const itemsInPlace = items.filter(it => it.placeId === placeId);
        const itemIds = new Set(itemsInPlace.map(it => it.itemId));
        for (const itemId of itemIds) {
            const sameItems = itemsInPlace.filter(it => it.itemId === itemId);
            itemsMessage += `\n- ${sameItems[0].fullName} (${sameItems.map(it => it.itemAlias).join(', ')})`;
        }

        itemsMessages.push(itemsMessage);
    }

    return [placesMessage, ...itemsMessages];
}