function test_GoogleSheetClient() {
  const inst = new GoogleSheetClient();
  const res = inst.deleteOrder('test2');
  console.log(res);
}

class GoogleSheetClient {
  constructor() {
    this._spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  getConfig() {
    const sheet = this._spreadsheet.getSheetByName('Config');

    const settings = Object.fromEntries(this._getNonEmptyValues(sheet, 'A3:B'));

    const placesValues = this._getNonEmptyValues(sheet, 'D3:F')
    const places = placesValues.map(row => ({ alias: row[0], fullName: row[1], id: row[2] }))

    const itemsValues = this._getNonEmptyValues(sheet, 'H3:K');
    const items = itemsValues.map(row => ({ placeId: row[0], itemAlias: row[1], itemId: row[2], fullName: row[3] }));

    const usersValues = this._getNonEmptyValues(sheet, 'M3:O');
    const users = usersValues.map(row => ({ telegramId: row[0], woltId: row[1], alias: row[2] }));

    return { settings, places, items, users };
  }

  setRefreshToken(refreshToken) {
    const sheet = this._spreadsheet.getSheetByName('Config');
    
    const allSettings = sheet.getRange('A:A').getValues();
    const propIndex = allSettings.indexOf(woltRefreshToken);
    sheet.getRange(propIndex + 1, 2).setValue(refreshToken);
  }

  registerOrder(orderId, date) {
    const sheet = this._spreadsheet.getSheetByName('OrdersToDelete');
    sheet.appendRow([orderId, date]);
    sheet.insertRowAfter(sheet.getLastRow());
  }

  getOrders() {
    const sheet = this._spreadsheet.getSheetByName('OrdersToDelete');

    const values = this._getNonEmptyValues(sheet, 'A2:B');
    return values.map(row => ({ orderId: row[0], createdAt: row[1] }));
  }

  deleteOrder(orderId) {
    const sheet = this._spreadsheet.getSheetByName('OrdersToDelete');

    const values = sheet.getRange('A:A').getValues();
    const index = values.findIndex(row => row[0] === orderId);

    sheet.deleteRow(index + 1);
  }

  saveLog(date, log) {
    const sheet = this._spreadsheet.getSheetByName('Logs');
    sheet.appendRow([date, log]);
  }

  _getNonEmptyValues(sheet, range) {
    return sheet.getRange(range).getValues().filter(row => row.some(val => val !== ''));
  }
}