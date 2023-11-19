// @ts-check
"use strict";

import TelegramBot from 'node-telegram-bot-api';
import { MainRepository } from './clients/MainRepository.mjs';
import { WoltApiClient } from './clients/WoltApiClient.mjs';
import { cleanupOrdersAsync } from './services/CleanupService.mjs';
import { createOrderAndPrepareMessage } from './services/OrdersService.mjs';
import { getListsAsync } from './services/ListsService.mjs';

const updateRefreshTokenAsync = async () => {
  const mainRepository = new MainRepository();
  const config = await mainRepository.getSettingsAsync();

  const woltClient = new WoltApiClient(
    config.woltRefreshToken,
    mainRepository.setRefreshTokenAsync);
  const res = await woltClient.updateRefreshTokenAsync();
};

const runBotAsync = async () => {
  const mainRepository = new MainRepository();
  const settings = await mainRepository.getSettingsAsync();
  const allowedUsers = await mainRepository.getUsersAsync();

  const bot = new TelegramBot(settings.telegramToken, { polling: true });

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

      // TODO: send to all users
      for (const user of allowedUsers.filter(x => x.telegramId === msg.chat.id)) {
        bot.sendMessage(user.telegramId, response, { disable_web_page_preview: true });
      }
    } catch (e) {
      console.error(e);
      bot.sendMessage(msg.chat.id, 'Unknown error: ' + e);
    }
  });

  console.log('Bot is running.');
};

setInterval(updateRefreshTokenAsync, 1000 * 60 * 30);
setInterval(cleanupOrdersAsync, 1000 * 60 * 15);
await runBotAsync();
