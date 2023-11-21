# WoltOrderingBot

## Description

This is a Telegram bot that can be used to order food from Wolt. It is written in Node.js.

It allows you to create a group order, where everyone can add their own orders. The bot will then send the order to Wolt and create a link to the order. The link can be shared with everyone in the group, so that they can pay for their own orders.

It also can add some predefined orders to the order, so that you can order for example a pizza for everyone.

## Installation

1. Clone the repository
2. Create a Telegram bot with [BotFather](https://t.me/BotFather)
3. Create a Wolt account
4. Choose a database to use (sqlite or google sheets 😁)
    1. If you want to use sqlite:
        1. Run `npm install:sqlite`
        2. Run project with `npm run start`
        3. Stop the project with Ctrl+C
        4. Open the created database file and fill the database with the needed tables (see below)
    2. If you want to use google sheets:
        1. Run `npm install:gas` (or just `npm install`)
        2. Create a google sheets document
        3. Create a Apps Script project and copy the code from folder "gas_database" to it
        4. Deploy the project as a web app
        5. Copy the url of the web app and add it to the config file
        6. Setup the sheets document as described below

## Setup

See the description of the database in the 'Database description' section.

1. Fill the users table with telegram ids (you can get them from the bot logs) and wolt ids (you can get them from the Wolt request in the browser when you are logged in to Wolt and create an group order).

2. Fill the places table with wolt ids (you can get them from the Wolt request in the browser when you are logged in to Wolt and create an group order) and full names (you can get them from the Wolt request in the browser when you are logged in to Wolt and create an group order). Create nice aliases for them.  
**WARN:** Aliases are used to add items to the order, should be short and easy to type. They must be unique and must not contain spaces and must be in lower case.

3. Fill the items table with wolt ids (you can get them from the Wolt request in the browser when you are logged in to Wolt and create an group order), full names (you can get them from the Wolt request in the browser when you are logged in to Wolt and create an group order) and aliases (should be short and easy to type).  
Aliases may repeat for different places. They may even repeat for the same place, but then the bot will add all items with this alias to the order.  
**WARN:** Aliases should not contain spaces and must be in lower case.

4. Fill the settings table with the needed settings.

5. Run the project with `npm run start`

### Database description

#### Sqlite

The database file is created automatically when you run the project for the first time. You can find it in the root folder of the project. You can open it with a sqlite browser, for example [DB Browser for SQLite](https://sqlitebrowser.org/).

The database needs to have the following tables:

##### Settings

Settings must contain the following rows:

- `woltRefreshToken` - Wolt refresh token. You can get it from the cookie '_wrtoken' in the browser when you are logged in to Wolt.
- `telegramToken` - Telegram bot token. You can get it from [BotFather](https://t.me/BotFather).
- `ordersExpirationMinutes` - How many minutes the order is valid after it has been created.
- `deliveryInfoStr` - Delivery info string. You can get it from a Wolt request in the browser when you are logged in to Wolt and create an group order. It is the value of the parameter `delivery_info` in the request. Should be a JSON string. Example: `{ "location": { ... }, "manual_override": false, "phone_number": "+123456789", "delivery_information_id": "1231123131313131331", "use_last_100m_address_picker": true ... }`

| Column | Type | Description          | Example            |
| ------ | ---- | -------------------- | ------------------ |
| name   | TEXT | Name of the setting  | `woltRefreshToken` |
| value  | TEXT | Value of the setting | `1234567890`       |

##### Users

Information about the users is stored in this table.
The bot answers only to the users that are in this table.
It also sends the created order to all users in this table.

| Column     | Type    | Description             | Example      |
| ---------- | ------- | ----------------------- | ------------ |
| telegramId | INTEGER | Telegram id of the user | `1234567890` |
| woltId     | TEXT    | Wolt id of the user     | `1234567890` |
| alias      | TEXT    | Name of the user        | `John Doe`   |

##### Places

Venues are stored in this table.

| Column   | Type | Description            | Example      |
| -------- | ---- | ---------------------- | ------------ |
| alias    | TEXT | Name of the venue      | `kfc`        |
| id       | TEXT | Wolt id of the venue   | `1234567890` |
| fullName | TEXT | Full name of the venue | `KFC London` |

##### Items

Well-known items that can be ordered on group order creation.

| Column    | Type | Description            | Example            |
| --------- | ---- | ---------------------- | ------------------ |
| placeId   | TEXT | Wolt id of the venue   | `1234567890`       |
| itemAlias | TEXT | Name of the item       | `pizza`            |
| itemId    | TEXT | Wolt id of the item    | `1234567890`       |
| fullName  | TEXT | Full name of the item  | `Pizza Margherita` |

##### OrdersToDelete

No need to fill this table manually.

#### Google Sheets

To use google sheets as a database you need to pass the url of the web app to the config file or to the environment variable `GAS_DB_ENDPOINT`.

The database is a google sheets document. It must have the following sheets:

##### Config

It is not important what is in 2 first rows. The bot will use the values from the 3rd row.

The 'Config' sheet must contain 4 separate tables:

###### Settings (google sheets sheet)

Placed in the range `A3:B6`. Must contain pairs of setting name and setting value.
See the description of the 'Settings' table in the 'Sqlite' section for more information.

###### Places (google sheets sheet)

Placed in the range `D3:F`. Must contain tuples of place alias, place id and place full name.
See the description of the 'Places' table in the 'Sqlite' section for more information.

###### Items (google sheets sheet)

Placed in the range `H3:K`. Must contain tuples of place id, item alias, item id and item full name.
See the description of the 'Items' table in the 'Sqlite' section for more information.

###### Users (google sheets sheet)

Placed in the range `M3:O`. Must contain tuples of telegram id, wolt id and user alias.
See the description of the 'Users' table in the 'Sqlite' section for more information.

##### OrdersToDelete (google sheets tab)

It is not important what is in the first row. The bot will use the values from the 2nd row.

Data will be placed in the range `A2:B`. Will contain pairs of order id and chat id. The bot will delete the orders from Wolt and from the database when it finds them in this table.

First column is the order id, second column is the creation time in JavaScript ISO string format.

##### Logs (google sheets tab)

Data will be placed in the range `A1:B`. Will contain pairs of log message and creation time in JavaScript ISO string format.

## Usage

### Commands

- `/cancel` - Cancel all the group orders.
- `/list` - Show all lists (places and its items).
- `/s <item name>` - Search for an item in all places.
- `(place alias)` - Create a group order for the place with the given alias.

#### Order creation command format

The command must contain exactly one place alias and may contain items aliases with or without amounts.

The command must be in the following format:

`(place alias) (item alias) (amount) (item alias) (amount) ...`

or

`(place alias) (item alias) (item alias) (amount) ...`

If the command contains only the place alias, then the bot will create an empty order.

If an item does not have an amount, then the bot will add only one item to the order.
