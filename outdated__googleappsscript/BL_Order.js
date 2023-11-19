function test_processMessage() {
  const spreadsheetClient = new GoogleSheetClient();
  processMessage(spreadsheetClient, 442033576, 'шава veggie aff');
}

function processMessage(spreadsheetClient, chatId, text) {
  const config = spreadsheetClient.getConfig();

  const isAllowedUser = config.users.some(user => user.telegramId === chatId);
  if (!isAllowedUser) {
    Logger.log('User is not allowed.')
    return;
  }

  const tokens = text.split(' ');

  const telegramClient = new TelegramClient(config.settings.telegramToken);
  const place = _findPlace(tokens, config.places, chatId, telegramClient);
  if (!place) {
    return;
  }

  const items = _findItems(tokens, place, config.items);

  const woltClient = new WoltApiClient(
    config.settings.woltRefreshToken,
    spreadsheetClient.setRefreshToken);
  Logger.log('Creating order.');
  const order = woltClient.createOrder(place.alias, place.id, JSON.parse(config.settings.deliveryInfoStr));
  spreadsheetClient.registerOrder(order.id, new Date());

  Logger.log('Adding items.');
  for (const item of items) {
    woltClient.addItem(order.id, item.itemId);
  }

  Logger.log('Inviting users.');
  for (const user of config.users.filter(user => !!user.woltId)) {
    woltClient.inviteUser(order.id, user.woltId);
  }

  Logger.log('Sending result.');
  const message = `
Order has been created.
Link: ${order.link}
Place: ${place.fullName}
Added items: ${items.length}
${items.map(item => `- ${item.fullName}`).join(`\n`)}

The order will be deleted in ${config.settings.ordersExpirationMinutes} minutes.
  `;
  telegramClient.sendMessage(chatId, message);
}

function _findPlace(tokens, allPlaces, chatId, telegramClient) {
  const places = allPlaces
    .filter(place => tokens.includes(place.alias) || tokens.includes(place.fullName));

  if (!places.length) {
    Logger.log('Place not found.');
    telegramClient.sendMessage(chatId, 'Place not found.');
    return;
  }

  if (places.length > 1) {
    Logger.log('Too many places found: %s.', places);
    telegramClient.sendMessage(chatId, 'Too many places found.');
    return;
  }

  Logger.log('Place found: %s.', places[0]);
  return places[0];
}

function _findItems(tokens, place, allItems) {
  const items = allItems
    .filter(item => item.placeId === place.id)
    .filter(item => tokens.includes(item.itemAlias) || tokens.includes(item.fullName));

  Logger.log('%s items found: %s.', items.length, items);
  return items;
}










