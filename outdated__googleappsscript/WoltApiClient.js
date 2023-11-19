function test_WoltApiClient() {
  const spreadsheetClient = new GoogleSheetClient();
  const config = spreadsheetClient.getConfig();

  const woltClient = new WoltApiClient(
    config.settings.woltRefreshToken,
    spreadsheetClient.setRefreshToken);

  woltClient.updateRefreshToken();
}

class WoltApiClient {
  constructor(refreshToken, setRefreshTokenCallback) {
    this.refreshToken = refreshToken;
    this.setRefreshTokenCallback = setRefreshTokenCallback;
    this.accessToken = null;

    if (!setRefreshTokenCallback) {
      throw Error('setRefreshTokenCallback must be set.');
    }
  }

  createOrder(orderName, placeId, delivaryInfo) {
    Logger.log('Creating order %s.', orderName);
    this._authorize();

    const order = { id: 'some_order_id', link: 'http://example.com/acad' }

    Logger.log('Created order %s with id=%s', orderName, order.id);
    return order;
  }

  addItem(orderId, itemId) {
    Logger.log('Adding item %s to order %s.', itemId, orderId);
    this._authorize();
    // 
    Logger.log('Added item %s to order %s.', itemId, orderId);
  }

  inviteUser(orderId, userId) {
    Logger.log('Inviting user %s to order %s.', userId, orderId);
    this._authorize();
    // 
    Logger.log('Invited user %s to order %s.', userId, orderId);
  }

  deleteOrder(orderId) {
    Logger.log('Deleting order %s.', orderId);
    this._authorize();
    // 
    Logger.log('Deleted order %s.', orderId);
  }

  updateRefreshToken() {
    this._authorize();
  }

  _authorize() {
    if (this.accessToken) {
      return;
    }

    const options = {
      method: 'POST',
      muteHttpExceptions: true,
      payload: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(this.refreshToken)
    }

    const response = UrlFetchApp.fetch('https://authentication.wolt.com/v1/wauth2/access_token', options);
    new GoogleSheetClient().saveLog('', response.getContentText());
    const s = response.getContentText();
    const result = JSON.parse(response.getContentText());

    if (result['refresh_token']) {
      this.setRefreshTokenCallback(result['refresh_token']);
    }

    this.accessToken = response['access_token'];
  }
}












