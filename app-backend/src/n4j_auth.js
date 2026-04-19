const fs = require('fs');

const auth_f = process.env.NEO4J_AUTH_FILE;
console.log(auth_f);
const raw = fs.readFileSync(auth_f, 'utf8').trim();
const [usr, pss] = raw.split('/');

module.exports = {
    n4j_user: usr,
    n4j_pass: pss
};