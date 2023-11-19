// @ts-check
"use strict";

import winston from "winston";


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
            filename: 'logs/example.log',
            handleExceptions: true,
        })
    ],
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.colorize(),
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
