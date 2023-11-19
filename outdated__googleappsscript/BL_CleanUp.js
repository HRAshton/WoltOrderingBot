function test_cleanupOrders() {
  const spreadsheetClient = new GoogleSheetClient();
  const config = spreadsheetClient.getConfig();
  const woltClient = new WoltApiClient(
    config.settings.woltRefreshToken,
    spreadsheetClient.setRefreshToken);

  cleanupOrders(spreadsheetClient, woltClient);
}

function cleanupOrders(spreadsheetClient, woltClient) {
  const config = spreadsheetClient.getConfig();

  const { ordersExpirationMinutes } = config.settings;
  const maxAllowedDate = new Date(new Date().getTime() + ordersExpirationMinutes * 60 * 1000);
  const allOrders = spreadsheetClient.getOrders();
  const outdatedOrders = allOrders.filter(order => order.createdAt < maxAllowedDate);
  Logger.log('Found %s outdated orders: %s.', outdatedOrders.length, outdatedOrders);

  for (const order of outdatedOrders) {
    Logger.log('Deleting order %s.', order);
    spreadsheetClient.deleteOrder(order.orderId);
    woltClient.deleteOrder(order.orderId);
  }

  Logger.log('Cleanup complete.');
}