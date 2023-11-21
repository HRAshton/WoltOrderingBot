// @ts-check
"use strict";

import winston from "winston";

const logPrefix = new Date().toISOString().replace(/[\-\:]/g, '_').replace(/\..+/g, '');

/** @type {winston.LoggerOptions} */
const logConfiguration = {
    exitOnError: false,
    transports: [
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
        }),
        new winston.transports.File({
            level: 'debug',
            dirname: './logs',
            filename: `${logPrefix}.log`,
            handleExceptions: true,
            maxsize: 1024 * 1024 * 4, // 4MB
        })
    ],
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.splat(),
        winston.format.printf(({ message, timestamp, level, label }) => {
            return `${timestamp} (${label || 'NO_LABEL'}) [${level}] -> ${message}`;
        }),
    )
};

const logger = winston.createLogger(logConfiguration);

/**
 * @param {string} label 
 * @returns {winston.Logger}
 */
export const getLogger = (label) => logger.child({ label });
