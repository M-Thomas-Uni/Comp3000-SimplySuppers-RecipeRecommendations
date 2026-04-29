const neo4j = require('neo4j-driver');
const { n4j_user, n4j_pass } = require("./n4j_auth");

async function test_ready() {
    let driver;
    let session;
    
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
    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
}

async function get_recipe_by_id(id) {
    let driver;
    let session;

    try {
        const driver = neo4j.driver('neo4j://suppers-db:7687',
            neo4j.auth.basic(n4j_user, n4j_pass)
        )
    
        const session = driver.session({database: 'neo4j'});

        const result = await session.run(`MATCH (m:SetupFlag {flag:"SuppersDB_Initialised"}) RETURN m`);
        const initialised = result.records.length > 0;

        if (initialised) {

                    const results = await session.run(`MATCH (r:Recipe {RecipeID: "${id}"})
                                        WITH r as SelectedRecipe
                                        MATCH (SelectedRecipe)-[:CATEGORY_OF]->(c:Category)
                                        WITH SelectedRecipe, c as Category
                                        MATCH (SelectedRecipe)-[:USES_KEYWORD]->(k:Keyword)
                                        RETURN DISTINCT SelectedRecipe.Name as Name, Category.Name as Category, collect(k.Name) as Keywords, SelectedRecipe.URL as URL
                                        `)

            if (results.records.length > 0) {
                const recipe = results.records[0];
                return { 'Successful?':true, 'err': 'null', 'code':200,
                    'recipe': {
                        Name: recipe.get("Name"),
                        Category: recipe.get("Category"),
                        Keywords: recipe.get("Keywords"),
                        URL: recipe.get("URL")
                    }
                }
            } else {
                return { 'Successful?':false, 'err': 'No results found', 'code':204, 'recipe':null}

            }
        } else {
            console.log("Initialisation test returning False");
            return { 'Successful?':false, 'err': 'DB  data not initialised (or marker not set.)', 'code':503, 'recipe':null}
        }

    } catch (err) {
        console.log("Recipe search failing due to error:")
        console.error(err);
        return { 'Successful?':false, 'err': err};
    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
}

async function get_top_20_recipes() {
    let driver;
    let session;

    try {
        const driver = neo4j.driver('neo4j://suppers-db:7687',
            neo4j.auth.basic(n4j_user, n4j_pass)
        )
    
        const session = driver.session({database: 'neo4j'});

        const result = await session.run(`MATCH (m:SetupFlag {flag:"SuppersDB_Initialised"}) RETURN m`);
        const initialised = result.records.length > 0;

        if (initialised) {

                    const results = await session.run(`MATCH (rec:Recipe)
                                        WITH rec AS recipe
                                        MATCH (rev:Review)-[:REVIEWS]->(recipe)
                                        WITH recipe, sum(toInteger(rev.Rating)) AS SumRating, count(rev) AS NumRatings
                                        WITH recipe, SumRating, NumRatings, SumRating / NumRatings AS AvgRating
                                        MATCH (recipe)-[:CATEGORY_OF]->(c:Category)
                                        WITH recipe, c as category, SumRating, NumRatings, AvgRating
                                        MATCH (recipe)-[:USES_KEYWORD]->(k:Keyword)
                                        RETURN DISTINCT recipe.Name as Name, category.Name as Category, collect(k.Name) as Keywords, recipe.URL as URL, recipe.RecipeID AS ID, SumRating, NumRatings, AvgRating ORDER BY AvgRating DESC, SumRating DESC, NumRatings DESC, Name ASC LIMIT 20
                                        `)

            if (results.records.length > 0) {
                let recipe_list = []
                results.records.forEach(element => {
                    recipe_list.push(
                        {'recipe': {
                            Name: element.get("Name"),
                            Category: element.get("Category"),
                            Keywords: element.get("Keywords"),
                            URL: element.get("URL"),
                            ID: element.get("ID")
                        },
                        'SumRating': element.get("SumRating"),
                        'NumRatings': element.get("NumRatings"),
                        'AvgRating': element.get("AvgRating")
                        });
                });

                return { 'Successful?':true, 'err': 'null', 'code':200, 'recipes': recipe_list}
            } else {
                return { 'Successful?':false, 'err': 'No results found', 'code':204, 'recipe':null}

            }
        } else {
            console.log("Initialisation test returning False");
            return { 'Successful?':false, 'err': 'DB  data not initialised (or marker not set.)', 'code':503, 'recipe':null}
        }

    } catch (err) {
        console.log("Recipe search failing due to error:")
        console.error(err);
        return { 'Successful?':false, 'err': err};
    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
}

module.exports = { test_ready, get_recipe_by_id, get_top_20_recipes };