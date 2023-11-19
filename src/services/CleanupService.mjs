// @ts-check
"use strict";

import { getLogger } from "../LogManager.mjs";
import { MainRepository } from "../clients/MainRepository.mjs";
import { WoltApiClient } from "../clients/WoltApiClient.mjs";

const logger = getLogger('CleanupService');

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
    logger.verbose('Found %s outdated orders: %s.', outdatedOrders.length, JSON.stringify(outdatedOrders));

    for (const order of outdatedOrders) {
        logger.verbose('Deleting order %s.', JSON.stringify(order));
        await woltClient.deleteOrderAsync(order.orderId);
        await mainRepository.deleteOrderAsync(order.orderId);
    }

    logger.verbose('Cleanup complete.');
}
