// @ts-check
/// <reference path="../typings/Types.js" />
"use strict";

import { MainRepository } from "../clients/MainRepository.mjs";

/**
 * @param {MainRepository} mainRepository
 * @returns {Promise<string[]>}
 */
export async function getListsAsync(mainRepository) {
    const [places, items] = await Promise.all([
        mainRepository.getPlacesAsync(),
        mainRepository.getItemsAsync(),
    ]);

    let placesMessage = `Places (${places.length}):`;
    const itemsMessages = [];

    const placeIds = new Set(places.map(it => it.id));
    for (const placeId of placeIds) {
        const samePlaces = places.filter(it => it.id === placeId);

        placesMessage += `\n- ${samePlaces[0].fullName} (${samePlaces.map(it => `\`${it.alias}\``).join(', ')})`;

        let itemsMessage = `Items of ${samePlaces[0].fullName} (\`${samePlaces[0].alias}\`):`
        const itemsInPlace = items.filter(it => it.placeId === placeId);
        const uniqueItemAliases = new Set(itemsInPlace.map(it => it.itemAlias));
        const sortedAliases = [...uniqueItemAliases].sort();
        for (const itemAlias of sortedAliases) {
            const itemsWithSameAlias = itemsInPlace.filter(it => it.itemAlias === itemAlias);
            const joinedItems = itemsWithSameAlias.map(it => `'${it.fullName}'`).join(', ');
            itemsMessage += `\n- \`${itemsWithSameAlias[0].itemAlias}\` (${joinedItems})`;
        }

        itemsMessages.push(itemsMessage);
    }

    return [placesMessage, ...itemsMessages];
}