// @ts-check
"use strict";

import TelegramBot from 'node-telegram-bot-api';
import { MainRepository } from './clients/MainRepository.mjs';
import { WoltApiClient } from './clients/WoltApiClient.mjs';
import { cleanupOrdersAsync } from './services/CleanupService.mjs';
import { createOrderAndPrepareMessage } from './services/OrdersService.mjs';
import { getListsAsync } from './services/ListsService.mjs';
import { ORDERS_CLEANUP_INTERVAL_SECS, REFRESH_TOKENS_INTERVAL_SECS } from './lowLevelConfiguration.mjs';

const updateRefreshTokenAsync = async () => {
  const mainRepository = new MainRepository();
  const config = await mainRepository.getSettingsAsync();

  const woltClient = new WoltApiClient(
    config.woltRefreshToken,
    mainRepository.setRefreshTokenAsync);
  await woltClient.updateRefreshTokenAsync();
};

/**
 * @param {TelegramBot} bot
 * @param {User[]} allowedUsers
 * @param {MainRepository} mainRepository
 * @returns {void}
 */
const setupBot = (bot, allowedUsers, mainRepository) => {
  bot.onText(/^\/lists$/, async (msg, _) => {
    if (!allowedUsers.some(user => user.telegramId === msg.chat.id)) {
      console.warn('User is not allowed: %d.', msg.chat.id);
      return;
    }

    console.log('User %d requested lists.', msg.chat.id);
    const responses = await getListsAsync(mainRepository);

    for (const response of responses) {
      bot.sendMessage(msg.chat.id, response);
    }
  });

  bot.onText(/^\/cancel$/, async (msg, _) => {
    try {
      if (!allowedUsers.some(user => user.telegramId === msg.chat.id)) {
        console.warn('User is not allowed: %d.', msg.chat.id);
        return;
      }

      const orders = await mainRepository.getOrdersAsync();
      if (!orders) {
        bot.sendMessage(msg.chat.id, 'No orders found.');
        return;
      }

      await cleanupOrdersAsync(true);

      bot.sendMessage(msg.chat.id, `${orders.length} orders cancelled.`);
    } catch (e) {
      console.error(e);
      bot.sendMessage(msg.chat.id, 'Unknown error: ' + e);
    }
  });

  bot.onText(/^[^\/].+$/, async (msg, _) => {
    try {
      if (!allowedUsers.some(user => user.telegramId === msg.chat.id)) {
        console.warn('User is not allowed: %d.', msg.chat.id);
        return;
      }

      const response = await createOrderAndPrepareMessage(
        mainRepository,
        allowedUsers,
        msg.text?.toLowerCase() || '');

      for (const user of allowedUsers) {
        bot.sendMessage(user.telegramId, response, { disable_web_page_preview: true });
      }
    } catch (e) {
      console.error(e);
      bot.sendMessage(msg.chat.id, 'Unknown error: ' + e);
    }
  });
}

const runBotAsync = async () => {
  try {
    const mainRepository = new MainRepository();
    const settings = await mainRepository.getSettingsAsync();
    const allowedUsers = await mainRepository.getUsersAsync();

    const bot = new TelegramBot(settings.telegramToken, { polling: true });
    setupBot(bot, allowedUsers, mainRepository);

    console.log('Bot is running.');
  } catch (e) {
    console.error(e);
    console.warn('Bot failed to start. Retrying in 5 seconds.');
    setTimeout(runBotAsync, 5000);
  }
};

setInterval(updateRefreshTokenAsync, REFRESH_TOKENS_INTERVAL_SECS * 1000);
setInterval(cleanupOrdersAsync, ORDERS_CLEANUP_INTERVAL_SECS * 1000);
await runBotAsync();
