const winston = require('winston');
require('winston-daily-rotate-file');
const { createLogger, format, transports } = require('winston');

const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${level}] - ${message}`;
});

const fileTransport = new winston.transports.DailyRotateFile({
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    dirname: 'tmp/logs',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '365d'
});
//const fileTransport = new winston.transports.File({ filename: 'output.log' })

const Self = {

    logger: null,
    init: function () {
        Self.logger = winston.createLogger({
            format: combine(
                timestamp(),
                myFormat
            ),
            transports: [
                new winston.transports.Console(),
                fileTransport
            ]
        });
    },

    _log(message,level) {
        Self.logger.log({ level, message });
    },

    logInfo(message) {
        return Self._log(message,'info')
    },

    logError(message) {
        return Self._log(message,'error')
    }
}
module.exports = Self