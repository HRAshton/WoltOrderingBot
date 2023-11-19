// @ts-check
/// <reference path="../typings/Types.js" />
"use strict";

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export class MainRepository {
  DATABASE_PATH = 'database.db';

  /** @type {Database} */
  _db;

  constructor() {
    this.getSettingsAsync = this.getSettingsAsync.bind(this);
    this.setRefreshTokenAsync = this.setRefreshTokenAsync.bind(this);
    this.registerOrderToDeleteAsync = this.registerOrderAsync.bind(this);
    this.deleteOrderAsync = this.deleteOrderAsync.bind(this);
  }

  /** @returns {Promise<Settings>} */
  async getSettingsAsync() {
    await this._initDatabaseAsync();
    const settings = await this._db.all('SELECT * FROM Settings');
    return Object.fromEntries(settings.map(setting => [setting.name, setting.value]));
  }

  /** @returns {Promise<Place[]>} */
  async getPlacesAsync() {
    await this._initDatabaseAsync();
    return await this._db.all('SELECT * FROM Places');
  }

  /** @returns {Promise<Item[]>} */
  async getItemsAsync() {
    await this._initDatabaseAsync();
    return await this._db.all('SELECT * FROM Items');
  }

  /** @returns {Promise<User[]>} */
  async getUsersAsync() {
    await this._initDatabaseAsync();
    return await this._db.all('SELECT * FROM Users');
  }

  /** @returns {Promise<RegisteredOrder[]>} */
  async getOrdersAsync() {
    await this._initDatabaseAsync();
    return await this._db.all('SELECT * FROM OrdersToDelete');
  }

  /**
   * @param {string} refreshToken 
   * @returns {Promise<void>}
   */
  async setRefreshTokenAsync(refreshToken) {
    await this._initDatabaseAsync();
    await this._db.run('UPDATE Settings SET value = ? WHERE name = ?', [refreshToken, 'woltRefreshToken']);
  }

  /**
   * @param {string} orderId
   * @param {string} createdAt
   * @returns {Promise<void>}
   */
  async registerOrderAsync(orderId, createdAt) {
    await this._initDatabaseAsync();
    await this._db.run('INSERT INTO OrdersToDelete (orderId, createdAt) VALUES (?, ?)', [orderId, createdAt]);
  }

  /**
   * @param {string} orderId
   * @returns {Promise<void>}
   */
  async deleteOrderAsync(orderId) {
    await this._initDatabaseAsync();
    await this._db.run('DELETE FROM OrdersToDelete WHERE orderId = ?', [orderId]);
  }

  /** @private */
  async _initDatabaseAsync() {
    if (this._db) {
      return;
    }

    this._db = await open({
      filename: this.DATABASE_PATH,
      driver: sqlite3.Database
    });

    await this._createDatabaseAsync();
  }

  /** @private */
  async _createDatabaseAsync() {
    await this._db.exec(`
      CREATE TABLE IF NOT EXISTS Settings (
        name TEXT PRIMARY KEY,
        value TEXT
      )`);

    await this._db.exec(`
      CREATE TABLE IF NOT EXISTS Places (
        alias TEXT PRIMARY KEY,
        fullName TEXT,
        id TEXT
      )`);

    await this._db.exec(`
      CREATE TABLE IF NOT EXISTS Items (
        placeId TEXT NOT NULL,
        itemAlias TEXT NOT NULL,
        itemId	TEXT NOT NULL,
        fullName TEXT NOT NULL
      )`);

    await this._db.exec(`
      CREATE TABLE IF NOT EXISTS Users (
        telegramId INTEGER PRIMARY KEY,
        woltId TEXT,
        alias TEXT
      )`);

    await this._db.exec(`
      CREATE TABLE IF NOT EXISTS OrdersToDelete (
        orderId TEXT PRIMARY KEY,
        createdAt TEXT
      )`);
  }
}
