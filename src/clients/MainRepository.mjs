// @ts-check
/// <reference path="../typings/Types.js" />
/// <reference path="../typings/MainRepository.js" />
"use strict";

import { GoogleSheetsRepository } from "./GoogleSheetsRepository.mjs";

// Switch between GoogleSheetsRepository and SqliteRepository
/** @type {MainRepository} */
export { GoogleSheetsRepository as MainRepository };
