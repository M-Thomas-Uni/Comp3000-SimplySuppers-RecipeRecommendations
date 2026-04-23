const neo4j = require('neo4j-driver');
const { n4j_user, n4j_pass } = require("./n4j_auth");

async function test_ready() {
    
    try {
        const driver = neo4j.driver('neo4j://suppers-db:7687',
            neo4j.auth.basic(n4j_user, n4j_pass)
        )
    
        const session = driver.session({database: 'neo4j'});

        const result = await session.run(`MATCH (m:SetupFlag {flag:"SuppersDB_Initialised"}) RETURN m`);
        const initialised = result.records.length > 0;
        
        if (initialised) {
            console.log("Initialisation test returning True");
            return { 'Successful?':true, 'err': null}
        }else {
            console.log("Initialisation test returning False");
            return { 'Successful?':false, 'err': 'DB  data not initialised (or marker not set.)'}
        }

    } catch (err) {
        console.log("Healthcheck tests failing due to error:")
        console.error(err);
        return { 'Successful?':false, 'err': err};
    }
}

module.exports = { test_ready };