function test_doPost() {
  doPost({
    postData: {
      contents: JSON.stringify({
        "message": { "chat": { "id": 442033576 }, "text": "Огура" }
      }),
    }
  })
}

function doPost(e) {
  const spreadsheetClient = new GoogleSheetClient();

  try {
    Logger.log(e.postData.contents);
    const contents = JSON.parse(e.postData.contents);
    Logger.log(contents);

    const chatId = contents.message.chat.id;
    const text = contents.message.text;
    Logger.log({ chatId, text });

    processMessage(spreadsheetClient, chatId, text);
  } catch (ex) {
    Logger.log(ex);
  }

  saveLogs(spreadsheetClient);
}

function trigger_cleanUp() {
  const spreadsheetClient = new GoogleSheetClient();
  const config = spreadsheetClient.getConfig();
  const woltClient = new WoltApiClient(
    config.settings.woltRefreshToken,
    spreadsheetClient.setRefreshToken);

  cleanupOrders(spreadsheetClient, woltClient);

  saveLogs(spreadsheetClient);
}

function trigger_updateRefreshToken() {
  const spreadsheetClient = new GoogleSheetClient();
  const config = spreadsheetClient.getConfig();

  const woltClient = new WoltApiClient(
    config.settings.woltRefreshToken,
    spreadsheetClient.setRefreshToken);

  woltClient.updateRefreshToken();
}

function register() {
  const spreadsheetClient = new GoogleSheetClient();
  const config = spreadsheetClient.getConfig();

  const telegramClient = new TelegramClient(config.settings.telegramToken);
  telegramClient.registerWebhook(config.settings.scriptWebhookUrl);
}
