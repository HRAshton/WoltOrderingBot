function test_saveLogs() {
  const spreadsheetClient = new GoogleSheetClient();
  saveLogs(spreadsheetClient);
}

function saveLogs(spreadsheetClient) {
  Logger.log('Saving log.');

  const log = Logger.getLog();
  spreadsheetClient.saveLog(new Date().toISOString(), log);

  Logger.log('Saved log.');
}