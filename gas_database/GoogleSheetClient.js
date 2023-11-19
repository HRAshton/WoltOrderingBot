function test_GoogleSheetClient() {
  const inst = new GoogleSheetClient();
  const res = inst.getOrders('test2');
  console.log(res);
}

class GoogleSheetClient {
  constructor() {
    this._spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  getSettings() {
    const sheet = this._spreadsheet.getSheetByName('Config');
    return Object.fromEntries(this._getNonEmptyValues(sheet, 'A3:B'));
  }

  getPlaces() {
    const sheet = this._spreadsheet.getSheetByName('Config');
    const placesValues = this._getNonEmptyValues(sheet, 'D3:F');
    return placesValues.map(row => ({ alias: row[0], fullName: row[1], id: row[2] }));
  }

  getUsers() {
    const sheet = this._spreadsheet.getSheetByName('Config');
    const usersValues = this._getNonEmptyValues(sheet, 'M3:O');
    return usersValues.map(row => ({ telegramId: row[0], woltId: row[1], alias: row[2] }));
  }

  getItems() {
    const sheet = this._spreadsheet.getSheetByName('Config');
    const itemsValues = this._getNonEmptyValues(sheet, 'H3:K');
    return itemsValues.map(row => ({ placeId: row[0], itemAlias: row[1], itemId: row[2], fullName: row[3] }));
  }

  getOrders() {
    const sheet = this._spreadsheet.getSheetByName('OrdersToDelete');

    const values = this._getNonEmptyValues(sheet, 'A2:B');
    return values.map(row => ({ orderId: row[0], createdAt: row[1] }));
  }

  registerOrder(params) {
    const { orderId, createdAt } = params;

    const sheet = this._spreadsheet.getSheetByName('OrdersToDelete');
    sheet.appendRow([orderId, createdAt]);
    sheet.insertRowAfter(sheet.getLastRow());
  }

  deleteOrder(params) {
    const { orderId } = params;

    const sheet = this._spreadsheet.getSheetByName('OrdersToDelete');
    const values = sheet.getRange('A:A').getValues();
    const index = values.findIndex(row => row[0] === orderId);
    if (index > -1) {
      sheet.insertRowAfter(sheet.getLastRow());
      sheet.deleteRow(index + 1);
    }
  }

  setRefreshToken(params) {
    const { woltRefreshToken } = params;

    const sheet = this._spreadsheet.getSheetByName('Config');

    const allSettings = sheet.getRange('A:A').getValues().map(x => x[0]);
    const propIndex = allSettings.indexOf('woltRefreshToken');
    if (propIndex === -1) {
      Logger.log('Setting woltRefreshToken not found.');
      throw new Error('Setting woltRefreshToken not found.');
    }

    sheet.getRange(propIndex + 1, 2).setValue(woltRefreshToken);
  }

  saveLog(params) {
    const { date, log } = params;

    const sheet = this._spreadsheet.getSheetByName('Logs');
    sheet.appendRow([date, log]);
  }

  _getNonEmptyValues(sheet, range) {
    return sheet.getRange(range).getValues().filter(row => row.some(val => val !== ''));
  }
}