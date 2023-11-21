// @ts-check
"use strict";

import TelegramBot from 'node-telegram-bot-api';
import { MainRepository } from './clients/MainRepository.mjs';
import { WoltApiClient } from './clients/WoltApiClient.mjs';
import { cleanupOrdersAsync } from './services/CleanupService.mjs';
import { createOrderAndPrepareMessage } from './services/OrdersService.mjs';
import { getListsAsync } from './services/ListsService.mjs';
import { ORDERS_CLEANUP_INTERVAL_SECS, REFRESH_TOKENS_INTERVAL_SECS } from './lowLevelConfiguration.mjs';
import { getLogger } from './LogManager.mjs';
import { searchItemsEverywhereAsync } from './services/SearchService.mjs';

const logger = getLogger('index.js');

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
  /** @type {import('node-telegram-bot-api').SendMessageOptions} */
  const sharedSendOptions = { disable_web_page_preview: true, parse_mode: 'Markdown' };

  bot.onText(/^\/lists$/, async (msg, _) => {
    if (!allowedUsers.some(user => user.telegramId === msg.chat.id)) {
      logger.warn('User is not allowed: %d.', msg.chat.id);
      return;
    }

    logger.info('User %d requested lists.', msg.chat.id);
    const responses = await getListsAsync(mainRepository);

    for (const response of responses) {
      bot.sendMessage(msg.chat.id, response, sharedSendOptions);
    }
  });

  bot.onText(/^\/cancel$/, async (msg, _) => {
    try {
      if (!allowedUsers.some(user => user.telegramId === msg.chat.id)) {
        logger.warn('User is not allowed: %d.', msg.chat.id);
        return;
      }

      const orders = await mainRepository.getOrdersAsync();
      if (!orders) {
        bot.sendMessage(msg.chat.id, 'No orders found.', sharedSendOptions);
        return;
      }

      await cleanupOrdersAsync(true);

      bot.sendMessage(msg.chat.id, `${orders.length} orders cancelled.`);
    } catch (e) {
      logger.error(e);
      bot.sendMessage(msg.chat.id, 'Unknown error: ' + e, sharedSendOptions);
    }
  });

  bot.onText(/^[^\/]+$/, async (msg, _) => {
    try {
      if (!allowedUsers.some(user => user.telegramId === msg.chat.id)) {
        logger.warn('User is not allowed: %d.', msg.chat.id);
        return;
      }

      const { message, successful } = await createOrderAndPrepareMessage(
        mainRepository,
        allowedUsers,
        msg.text?.toLowerCase() || '');

      const usersToNotify = successful
        ? allowedUsers
        : allowedUsers.filter(user => user.telegramId === msg.chat.id);
      for (const user of usersToNotify) {
        bot.sendMessage(user.telegramId, message, sharedSendOptions);
      }
    } catch (e) {
      logger.error('%o', e);
      bot.sendMessage(msg.chat.id, 'Unknown error: ' + e, sharedSendOptions);
    }
  });

  bot.onText(/^\/s(.*)$/, async (msg, match) => {
    const searchQuery = (match && match[1])?.trim();
    logger.info('User %d requested search for %s.', msg.chat.id,);

    if (!searchQuery || searchQuery.length < 3) {
      logger.warn('Request for search with invalid query: %s.', searchQuery);
      bot.sendMessage(msg.chat.id, 'Please specify a search query.', sharedSendOptions);
      return;
    }

    const messageLines = await searchItemsEverywhereAsync(mainRepository, searchQuery);
    const messages = [];
    for (const line of messageLines) {
      if (messages.length && messages[messages.length - 1].length + line.length < 4096) {
        messages[messages.length - 1] += '\n' + line;
      } else {
        messages.push(line);
      }
    }

    for (const message of messages) {
      await bot.sendMessage(msg.chat.id, message, sharedSendOptions);
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

    logger.info('Bot is running.');
  } catch (e) {
    logger.error('%o', e);
    logger.warn('Bot failed to start. Retrying in 5 seconds.');
    setTimeout(runBotAsync, 5000);
  }
};

setInterval(updateRefreshTokenAsync, REFRESH_TOKENS_INTERVAL_SECS * 1000);
setInterval(cleanupOrdersAsync, ORDERS_CLEANUP_INTERVAL_SECS * 1000);
await runBotAsync();
