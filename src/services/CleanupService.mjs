// @ts-check
"use strict";

import { MainRepository } from "../clients/MainRepository.mjs";
import { WoltApiClient } from "../clients/WoltApiClient.mjs";

/**
 * @param {boolean} forced
 */
export async function cleanupOrdersAsync(forced) {
    const mainRepository = new MainRepository();
    const config = await mainRepository.getSettingsAsync();

    const woltClient = new WoltApiClient(
        config.woltRefreshToken,
        mainRepository.setRefreshTokenAsync);

    await _cleanupOrdersAsync(mainRepository, woltClient, forced);
}

/**
 * @param {MainRepository} mainRepository
 * @param {WoltApiClient} woltClient
 * @param {boolean} forced
 */
async function _cleanupOrdersAsync(mainRepository, woltClient, forced) {
    const { ordersExpirationMinutes } = await mainRepository.getSettingsAsync();

    const maxAllowedDate = new Date(new Date().getTime() + ordersExpirationMinutes * 60 * 1000);
    const allOrders = await mainRepository.getOrdersAsync();
    const outdatedOrders = allOrders.filter(order => order.createdAt < maxAllowedDate.toISOString() || forced);
    console.log('Found %s outdated orders: %s.', outdatedOrders.length, JSON.stringify(outdatedOrders));

    for (const order of outdatedOrders) {
        console.log('Deleting order %s.', JSON.stringify(order));
        await mainRepository.deleteOrderAsync(order.orderId);
        await woltClient.deleteOrderAsync(order.orderId);
    }

    console.log('Cleanup complete.');
}
