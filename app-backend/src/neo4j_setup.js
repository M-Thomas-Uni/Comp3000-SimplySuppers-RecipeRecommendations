
const neo4j = require('neo4j-driver');
const {n4j_user, n4j_pass} = require('./n4j_auth.js')

async function neo_startup() {
    console.log("Attempting to connect to DB");

    const driver = neo4j.driver('neo4j://suppers-db:7687',
        neo4j.auth.basic(n4j_user, n4j_pass)
    )

    const session = driver.session({database: 'neo4j'});

    try {
        const result = await session.run(`MATCH (m:SetupFlag {flag:"SuppersDB_Initialised"}) RETURN m`);
        const initialised = result.records.length > 0;
        
        if(initialised) {
            console.log("Database initialised, presuming data has already been loaded.");

            await calculate_tf_weights_and_normals();

        } else {
            console.log("Database not initialised. Creating indexes then loading data.");

            await session.run(`CREATE CONSTRAINT RecipeID IF NOT EXISTS FOR (r:Recipe) REQUIRE r.RecipeID IS UNIQUE;`);
            await session.run(`CREATE CONSTRAINT IngredientID IF NOT EXISTS FOR (i:Ingredient) REQUIRE i.IngredientID IS UNIQUE;`);
            await session.run(`CREATE CONSTRAINT ReviewID IF NOT EXISTS FOR (r:Review) REQUIRE r.ReviewID IS UNIQUE;`);
            await session.run(`CREATE CONSTRAINT ReviewAuthorID IF NOT EXISTS FOR (reva:ReviewAuthor) REQUIRE reva.AuthorID IS UNIQUE;`);
            await session.run(`CREATE CONSTRAINT RecipeAuthorID IF NOT EXISTS FOR (reca:RecipeAuthor) REQUIRE reca.AuthorID IS UNIQUE;`);
            await session.run(`CREATE INDEX CategoryName IF NOT EXISTS FOR (c:Category) ON (c.Name);`);
            await session.run(`CREATE INDEX IngredientName IF NOT EXISTS FOR (i:Ingredient) ON (i.Name);`);
            await session.run(`CREATE INDEX KeywordName IF NOT EXISTS FOR (k:Keyword) ON (k.Name);`);
        
            console.log("Created Constraints and Indexes");

            //Load Recipes
            await session.run(`LOAD CSV WITH HEADERS FROM "file:///recipes_large.csv" AS row
                                WITH row
                                CALL (row) {

                                WITH row
                                WITH row, row.RecipeId AS id
                                WHERE id<>"" AND id IS NOT NULL
                                MERGE (recipe:Recipe {RecipeID:id})
                                SET recipe.Name = row.Name,
                                    recipe.DatePublished = row.DatePublished,
                                    recipe.CookTime = row.CookTime,
                                    recipe.PrepTime = row.PrepTime,
                                    recipe.Description = row.Description,
                                    recipe.Servings = row.RecipeServings,
                                    recipe.URL = "https://www.food.com/recipe/-" + id,
                                    recipe.Image_URL = row.Image
                                
                                WITH recipe, row, row.AuthorId AS id
                                MERGE (author:RecipeAuthor {AuthorID:id})
                                SET author.Name = row.AuthorName
                                MERGE (recipe)-[:WRITTEN_BY]->(author)
                                MERGE (author)-[:WROTE]->(recipe)  
                                
                                WITH recipe, row, row.RecipeCategory AS category  
                                WHERE category<>"" AND category IS NOT NULL
                                MERGE (c:Category {Name:category})
                                MERGE (recipe)-[:CATEGORY_OF]-(c)

                                WITH recipe, row, row.Ingredients AS ingredient_parts
                                WITH recipe, row,
                                    CASE WHEN ingredient_parts IS NULL OR ingredient_parts = "" 
                                        THEN [] 
                                        ELSE split(ingredient_parts, ";") 
                                    END AS ingredients
                                WITH recipe, row, ingredients,
                                    CASE WHEN size(ingredients) = 0 
                                        THEN [] 
                                        ELSE range(0, size(ingredients)-1) 
                                    END AS indexes
                                UNWIND indexes AS index
                                WITH recipe, row, trim(ingredients[index]) AS ingredient
                                WHERE ingredient <> "" AND ingredient IS NOT NULL
                                MERGE (i:Ingredient {Name:ingredient})
                                MERGE (recipe)-[:CONTAINS]->(i)

                                WITH recipe, row, row.Keywords AS kw
                                WITH recipe, row,
                                    CASE WHEN kw IS NULL OR kw = "" 
                                        THEN [] 
                                        ELSE split(kw, ";") 
                                    END AS keywords
                                UNWIND keywords AS keyword
                                WITH recipe, trim(keyword) AS keyword
                                WHERE keyword <> "" AND keyword IS NOT NULL
                                MERGE (k:Keyword {Name:keyword})
                                MERGE (recipe)-[:USES_KEYWORD]->(k)
                                } IN TRANSACTIONS OF 5000 ROWS`);
            console.log("Loaded Recipes.csv");

            //Load Reviews
            await session.run(`LOAD CSV WITH HEADERS FROM "file:///reviews_large.csv" AS row
                                WITH row
                                CALL (row) {

                                WITH row
                                WITH row, row.RecipeId AS id
                                WHERE id<>"" AND id IS NOT NULL
                                MATCH (recipe:Recipe {RecipeID:id})
                                WHERE recipe IS NOT NULL
                                MERGE (review:Review {ReviewID:row.ReviewId, RecipeID:row.RecipeId, AuthorID:row.AuthorId})
                                SET review.Rating=row.Rating,
                                    review.DatePublished=row.DateSubmitted
                                
                                WITH review, recipe, row, row.AuthorId AS id
                                MERGE (author:ReviewAuthor {AuthorID:id})
                                SET author.Name = row.AuthorName
                                MERGE (review)-[:WRITTEN_BY]->(author)
                                MERGE (author)-[:WROTE]->(review)

                                MERGE (review)-[:REVIEWS]->(recipe)

                                } IN TRANSACTIONS OF 5000 ROWS`);
            console.log("Loaded Reviews.csv");

            console.log("Adding Images from Recipe_Images.csv");
            await session.run(`LOAD CSV WITH HEADERS FROM "file:///recipe_images.csv" AS row
                                WITH row
                                CALL (row) {
                                WITH row
                                WITH row, row.RecipeId AS id, row.Images AS URL
                                WHERE id<>"" AND id IS NOT NULL
                                MATCH(recipe:Recipe{RecipeID:id})
                                WHERE recipe IS NOT NULL
                                SET recipe.Image_URL = URL
                                } IN TRANSACTIONS OF 5000 ROWS`);
            console.log("Loaded Recipe_Images.csv");

            console.log("Creating Category and Keyword IDs");
            await session.run(`MATCH (c:Category)
                                WITH c ORDER BY c.name
                                WITH collect(c) AS cats
                                UNWIND range(0, size(cats)-1) AS i
                                WITH cats[i] AS c, i + 1 AS newID
                                SET c.CategoryID = toString(newID);`);

            await session.run(`MATCH (k:Keyword)
                                WITH k ORDER BY k.name
                                WITH collect(k) AS keys
                                UNWIND range(0, size(keys)-1) AS i
                                WITH keys[i] AS k, i + 1 AS newID
                                SET k.KeywordID = toString(newID);`);
            
            console.log("Complete, setting flag");

            //Loaded data, setting flag
            await session.run(`MERGE (m:SetupFlag {flag:"SuppersDB_Initialised"})`);
            console.log("Set Initialised_SuppersDB Flag");

            await calculate_tf_weights_and_normals();

        }
        
    } catch (err) {
        console.error(err);
    } finally {
        await session.close();
        await driver.close();
    }
}

async function calculate_tf_weights_and_normals() {
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
            console.log("Starting pre-calculations");
            console.log("..IDF for Keywords");
            await session.run(`
                 //Compute IDF for KEywords
                MATCH (r:Recipe)
                WITH count(r) AS RecipeCount

                MATCH (k:Keyword)<-[:USES_KEYWORD]-(r2:Recipe)
                WITH k, RecipeCount, count(r2) AS doc_freq
                SET k.idf = log(RecipeCount * 1.0 / doc_freq)
                `);
            console.log("COMPLETE\n..IDF for Ingredients");
            await session.run(`
                //and ingredients
                MATCH (r:Recipe)
                WITH count(r) AS RecipeCount

                MATCH (i:Ingredient)<-[:CONTAINS]-(r2:Recipe)
                WITH i, RecipeCount, count(r2) AS doc_freq
                SET i.idf = log(RecipeCount * 1.0 / doc_freq)
                `);
            console.log("COMPLETE\n..TF for Recipe Keywords");
            await session.run(`
                //Compute TF for Recipe -> Keyword
                MATCH (r:Recipe)-[rel:USES_KEYWORD]->(k:Keyword)
                WITH r, count(rel) AS kCount, rel, k
                SET rel.tf_weight = (1.0 / kCount) * k.idf
                `);
            console.log("COMPLETE\n..TF for Recipe Ingredients");
            await session.run(`
                //again, for ingredients
                MATCH (r:Recipe)-[rel:CONTAINS]->(i:Ingredient)
                WITH r, count(rel) AS iCount, rel, i
                SET rel.tf_weight = (1.0 / iCount) * i.idf
                `);
            console.log("COMPLETE\n..Calculating Recipe Normals for Keyword vectors");
            await session.run(`
                //Keywords
                MATCH (r:Recipe)-[rel:USES_KEYWORD]->(:Keyword)
                WITH r, sum(rel.tf_weight^2) AS sum_squares
                SET r.kw_normal = sqrt(sum_squares)
                `);
            console.log("COMPLETE\n..Calculating Recipe Normals for Ingredient vectors");
            await session.run(`
                //Ingredients
                MATCH (r:Recipe)-[rel:CONTAINS]->(:Ingredient)
                WITH r, sum(rel.tf_weight^2) AS sum_squares
                SET r.iw_normal = sqrt(sum_squares)
                `);

            console.log("COMPLETE\nSetting completion flag");
            await session.run(`MERGE (m:SetupFlag {flag:"TF_Weights_And_Normals_Calculated"})`);
            
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

module.exports = { neo4j_startup: neo_startup, calculate_tf_weights_and_normals:calculate_tf_weights_and_normals};