function test_doPost() {
  doPost({
    postData: {
      contents: '{"method":"setRefreshToken","params":{"woltRefreshToken":"WkJW7schX2YJhuyd5A0HyMhR1EolBKqMN-6IuODFvcCAQ4A"}}'
    }
  })
}

function doPost(e) {
  Logger.log('Request received.');
  const spreadsheetClient = new GoogleSheetClient();

  let response;
  try {
    Logger.log('Plain payload: %s.', e);
    const payload = JSON.parse(e.postData.contents);
    Logger.log('Parsed payload: %s.', payload);

    const { method, params } = payload;

    response = spreadsheetClient[method](params);
    Logger.log('Response: %s.', response);
  } catch (ex) {
    Logger.log(ex);
    response = { error: JSON.stringify(ex) };
  }

  saveLogs(spreadsheetClient);

  const responseText = JSON.stringify(response);
  Logger.log('Response: %s.', responseText);
  return ContentService.createTextOutput(responseText);
}
