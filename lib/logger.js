
const log4js = require('log4js');
const level = process.env.ENV ? 'all' : 'info';

log4js.configure({
    appenders: { app: { type: 'console' } },
    categories: { default: { appenders: ['app'], level } }
});

const logger = log4js.getLogger();

module.exports = logger;
