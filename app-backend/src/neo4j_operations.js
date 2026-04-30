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
                                        RETURN DISTINCT SelectedRecipe.Name as Name, Category.Name as Category, Category.CategoryID as CategoryID, collect({Name:k.Name, KeywordID:k.KeywordID}) as Keywords, collect(k.KeywordID) as KeywordIDs, SelectedRecipe.URL as URL,  SelectedRecipe.Image_URL as Image_URL, SelectedRecipe.RecipeID AS RecipeID
                                        `)

            if (results.records.length > 0) {
                const recipe = results.records[0];
                console.log("Found recipe");
                return { 'Successful?':true, 'err': 'null', 'code':200,
                    'recipe': {
                        ID: recipe.get("RecipeID"),
                        Name: recipe.get("Name"),
                        Category: recipe.get("Category"),
                        CategoryID: recipe.get("CategoryID"),
                        Keywords: recipe.get("Keywords"),
                        URL: recipe.get("URL"),
                        Image_URL: recipe.get("Image_URL")
                    }
                }
            } else {
                console.log(`No recipes found with id: ${id}`);
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

async function get_top_recipes(lim=20) {
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
                                        RETURN DISTINCT recipe.Name as Name, category.Name as Category, category.CategoryID as CategoryID, collect({Name:k.Name, KeywordID:k.KeywordID}) as Keywords, recipe.URL as URL, recipe.RecipeID AS ID, SumRating, NumRatings, AvgRating ORDER BY AvgRating DESC, SumRating DESC, NumRatings DESC, Name ASC LIMIT ${lim}
                                        `)

            if (results.records.length > 0) {
                let recipe_list = []
                results.records.forEach(element => {
                    recipe_list.push(
                        {'recipe': {
                            Name: element.get("Name"),
                            Category: element.get("Category"),
                            CategoryID: element.get("CategoryID"),
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

async function get_top_in_cat(id, lim=20) {
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

                    const results = await session.run(`MATCH (rec:Recipe)-[:CATEGORY_OF]->(cat:Category{CategoryID:"${id}"})
                                        WITH rec AS recipe
                                        MATCH (rev:Review)-[:REVIEWS]->(recipe)
                                        WITH recipe, sum(toInteger(rev.Rating)) AS SumRating, count(rev) AS NumRatings
                                        WITH recipe, SumRating, NumRatings, SumRating / NumRatings AS AvgRating
                                        MATCH (recipe)-[:CATEGORY_OF]->(c:Category)
                                        WITH recipe, c as category, SumRating, NumRatings, AvgRating
                                        MATCH (recipe)-[:USES_KEYWORD]->(k:Keyword)
                                        RETURN DISTINCT recipe.Name as Name, category.Name as Category, category.CategoryID as CategoryID, collect({Name:k.Name, KeywordID:k.KeywordID}) as Keywords, recipe.URL as URL, recipe.RecipeID AS ID, SumRating, NumRatings, AvgRating ORDER BY AvgRating DESC, SumRating DESC, NumRatings DESC, Name ASC LIMIT ${lim}
                                        `)

            if (results.records.length > 0) {
                let recipe_list = []
                results.records.forEach(element => {
                    recipe_list.push(
                        {'recipe': {
                            Name: element.get("Name"),
                            Category: element.get("Category"),
                            CategoryID: element.get("CategoryID"),
                            Keywords: element.get("Keywords"),
                            URL: element.get("URL"),
                            ID: element.get("ID")
                        },
                        'SumRating': element.get("SumRating"),
                        'NumRatings': element.get("NumRatings"),
                        'AvgRating': element.get("AvgRating")
                        });
                });

                return { 'Successful?':true, 'err': 'null', 'code':200, 'CategoryName':results.records[0].get('Category'), 'recipes': recipe_list}
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

async function get_top_in_keyw(id, lim=20) {
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

                    const results = await session.run(`MATCH (rec:Recipe)-[:USES_KEYWORD]->(keyw:Keyword{KeywordID:"${id}"})
                                        WITH rec AS recipe, keyw
                                        MATCH (rev:Review)-[:REVIEWS]->(recipe)
                                        WITH recipe, sum(toInteger(rev.Rating)) AS SumRating, count(rev) AS NumRatings, keyw
                                        WITH recipe, SumRating, NumRatings, SumRating / NumRatings AS AvgRating, keyw
                                        MATCH (recipe)-[:CATEGORY_OF]->(c:Category)
                                        WITH recipe, c as category, SumRating, NumRatings, AvgRating, keyw
                                        MATCH (recipe)-[:USES_KEYWORD]->(k:Keyword)
                                        RETURN DISTINCT keyw.Name as Keyword, recipe.Name as Name, category.Name as Category, category.CategoryID as CategoryID, collect({Name:k.Name, KeywordID:k.KeywordID}) as Keywords, recipe.URL as URL, recipe.RecipeID AS ID, SumRating, NumRatings, AvgRating ORDER BY AvgRating DESC, SumRating DESC, NumRatings DESC, Name ASC LIMIT ${lim}
                                        `)

            if (results.records.length > 0) {
                let recipe_list = []
                results.records.forEach(element => {
                    recipe_list.push(
                        {'recipe': {
                            Name: element.get("Name"),
                            Category: element.get("Category"),
                            CategoryID: element.get("CategoryID"),
                            Keywords: element.get("Keywords"),
                            URL: element.get("URL"),
                            ID: element.get("ID")
                        },
                        'SumRating': element.get("SumRating"),
                        'NumRatings': element.get("NumRatings"),
                        'AvgRating': element.get("AvgRating")
                        });
                });

                return { 'Successful?':true, 'err': 'null', 'code':200, 'KeywordName':results.records[0].get('Keyword'), 'recipes': recipe_list}
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


async function get_cbf_recommended(id, lim=20) {
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

            const result = await session.run(`MATCH (m:SetupFlag {flag:"TF_Weights_And_Normals_Calculated"}) RETURN m`);
            const weights_calculated = result.records.length > 0;
            
            if (weights_calculated) {
                const results = await session.run(`
                    //Content-Based Filtering

                    //Get Subject
                    MATCH (Rs:Recipe{RecipeID:"${id}"})
                    WITH Rs
                    //Get Other
                    MATCH (Ro:Recipe)
                    WHERE Ro.RecipeID<>Rs.RecipeID

                    WITH Rs, Ro

                    // ----- KEYWORD SIMILARITY -----

                    //Get Keywords for each
                    MATCH (Rs)-[:USES_KEYWORD]->(RsK:Keyword)
                    WITH Rs, collect(RsK.Name) AS RsKeywords, Ro
                    MATCH (Ro)-[:USES_KEYWORD]->(RoK:Keyword)
                    WITH Rs, RsKeywords, Ro, collect(RoK.Name) AS RoKeywords

                    //Get the Union of distinct keywords from the two
                    WITH Rs, RsKeywords, Ro, RoKeywords, coll.distinct(RsKeywords + RoKeywords) AS UnionKeywords

                    //For each keyword in the union..
                    UNWIND UnionKeywords AS Fk //Focus Keyword

                    //Get pre-computed TF-IDF weights
                    OPTIONAL MATCH (Rs)-[r1:USES_KEYWORD]->(:Keyword {Name:Fk})
                    OPTIONAL MATCH (Ro)-[r2:USES_KEYWORD]->(:Keyword {Name:Fk})

                    //Either use the weight found, or 0.0
                    WITH Rs, Ro, coalesce(r1.tf_weight, 0.0) AS rs_k_weights, coalesce(r2.tf_weight, 0.0) AS ro_k_weights

                    //Collect into a combined vector
                    WITH Rs, Ro, collect({rs:rs_k_weights, ro:ro_k_weights}) AS KwVector

                    //Compute dot product
                    WITH Rs, Ro, KwVector,
                        reduce(dot = 0.0, x IN KwVector | dot + x.rs * x.ro)
                        AS dot

                    //Get pre-computed normals
                    WITH Rs, Ro, dot,
                        Rs.kw_normal AS norm_rs,
                        Ro.kw_normal AS norm_ro

                    //Compute cosine similarity
                    WITH Rs, Ro,
                        CASE
                            WHEN norm_rs = 0 OR norm_ro = 0 THEN 0.0
                            ELSE dot / (norm_rs * norm_ro)
                        END AS KwCosineSim

                    // ----- INGREDIENT SIMILARITY -----

                    //Get Ingredients for each
                    MATCH (Rs)-[:CONTAINS]->(RsI:Ingredient)
                    WITH Rs, collect(RsI) AS RsIngredients, Ro, KwCosineSim
                    MATCH (Ro)-[:CONTAINS]->(RoI:Ingredient)
                    WITH Rs, RsIngredients, Ro, KwCosineSim, collect(RoI) AS RoIngredients

                    //Get the Union of distinct ingredients from the two
                    WITH Rs, RsIngredients, Ro, KwCosineSim, RoIngredients, coll.distinct(RsIngredients + RoIngredients) AS UnionIngredients

                    //For each ingredient in the union..
                    UNWIND UnionIngredients AS Fi //Focus Ingredient

                    //Get pre-computed TF-IDF weights
                    OPTIONAL MATCH (Rs)-[r1:CONTAINS]->(Fi)
                    OPTIONAL MATCH (Ro)-[r2:CONTAINS]->(Fi)

                    //Either use the weight found, or 0.0
                    WITH Rs, Ro, KwCosineSim, coalesce(r1.tf_weight, 0.0) AS rs_i_weights, coalesce(r2.tf_weight, 0.0) AS ro_i_weights

                    //Collect into a combined vector
                    WITH Rs, Ro, KwCosineSim, collect({rs:rs_i_weights, ro:ro_i_weights}) AS IwVector

                    //Compute dot product
                    WITH Rs, Ro, KwCosineSim, IwVector,
                        reduce(dot = 0.0, x IN IwVector | dot + x.rs * x.ro)
                        AS dot

                    //Get pre-computed normals
                    WITH Rs, Ro, KwCosineSim, dot,
                        Rs.iw_normal AS norm_rs,
                        Ro.iw_normal AS norm_ro

                    //Compute cosine similarity
                    WITH Rs, Ro, KwCosineSim,
                        CASE
                            WHEN norm_rs = 0 OR norm_ro = 0 THEN 0.0
                            ELSE dot / (norm_rs * norm_ro)
                        END AS IwCosineSim

                    WITH Rs, Ro, KwCosineSim + IwCosineSim AS CosineSim
                    MATCH (Ro)-[:CATEGORY_OF]->(cat:Category)
                    WITH Rs, Ro, CosineSim, cat
                    MATCH (Ro)-[:USES_KEYWORD]->(kw:Keyword)
                    RETURN Rs, Ro.Name AS Name, cat.Name as Category, cat.CategoryID as CategoryID, collect({Name:kw.Name, KeywordID:kw.KeywordID}) as Keywords, Ro.URL AS URL, Ro.RecipeID AS ID, CosineSim ORDER BY CosineSim DESC LIMIT ${lim}
                    `);

                if (results.records.length > 0) {
                    let recipe_list = []
                    results.records.forEach(element => {
                        recipe_list.push(
                            {'recipe': {
                                Name: element.get("Name"),
                                Category: element.get("Category"),
                                CategoryID: element.get("CategoryID"),
                                Keywords: element.get("Keywords"),
                                URL: element.get("URL"),
                                ID: element.get("ID")
                            },
                            'CosineSimilarity': element.get("CosineSim")
                            });
                    });

                    return { 'Successful?':true, 'err': 'null', 'code':200, 'recipes': recipe_list}
                } else {
                    console.log(`No recipes recommended for recipe with id: ${id}`);
                    return { 'Successful?':false, 'err': 'No results found', 'code':204, 'recipe':null}
                }
            } else {
                console.log("Weight calculation test returning False");
                return { 'Successful?':false, 'err': 'Weights not calculated (or marker not set.)', 'code':503, 'recipe':null}
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


module.exports = { test_ready, get_recipe_by_id, get_top_recipes, get_cbf_recommended, get_top_in_cat, get_top_in_keyw };