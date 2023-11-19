function test_TelegramClient() {
  const config = new GoogleSheetClient().getConfig();
  const token = config.settings.telegramToken;
  const users = config.users.map(x => x.telegramId);

  const inst = new TelegramClient(token, users);
  const res = inst.sendMessage(442033576, 'hi');
  Logger.log(res);
}

class TelegramClient {
  constructor(token) {
    this._token = token;
  }

  sendMessage(userId, text) {
    const data = { chat_id: userId, text };
    this._sendApiRequest('sendMessage', data);

    Logger.log(`Message sent: '${text}' to '${userId}'.`)
  }

  registerWebhook(deploymentUrl) {
    const data = { url: deploymentUrl };
    this._sendApiRequest('setWebhook', data);
  }

  _sendApiRequest(method, data) {
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(data),
    };

    Logger.log(`Calling: '${method}' with args '${options.payload}'.`);
    const result = UrlFetchApp.fetch(`https://api.telegram.org/bot${this._token}/${method}`, options);
    Logger.log(`Response: '${result.getContentText()}'.`);
  }
}
