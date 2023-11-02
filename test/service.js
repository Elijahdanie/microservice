const { exec } = require('child_process');
const {Worker} = require('worker_threads');

exec('redis-server');

const email = new Worker('./test/email.js');
const logger = new Worker('./test/logger.js');
const storeBuilder = new Worker('./test/storeBuilder.js');
const auth = new Worker('./test/auth.js');

setTimeout(() => {
    exec('./test/request.sh');
}, 5000);
