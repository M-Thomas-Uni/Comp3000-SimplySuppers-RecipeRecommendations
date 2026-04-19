
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
            await session.run(`LOAD CSV WITH HEADERS FROM "file:///recipes.csv" AS row
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
                                    recipe.URL = "https://www.food.com/recipe/-" + id
                                
                                WITH recipe, row, row.AuthorId AS id
                                MERGE (author:RecipeAuthor {AuthorID:id})
                                SET author.Name = row.AuthorName
                                MERGE (recipe)-[:WRITTEN_BY]->(author)
                                MERGE (author)-[:WROTE]->(recipe)  
                                
                                WITH recipe, row, row.RecipeCategory AS category  
                                WHERE category<>"" AND category IS NOT NULL
                                MERGE (c:Category {Name:category})
                                MERGE (recipe)-[:CATEGORY_OF]-(c)

                                WITH recipe, row, row.RecipeIngredientParts AS ingredient_parts, row.RecipeIngredientQuantities AS ingredient_quantities
                                WITH recipe, row, split(ingredient_parts, ",") AS ingredients, split(ingredient_quantities, ",") AS quantities
                                WITH recipe, row, ingredients, quantities, range(0, size(ingredients)-1) AS indexes

                                UNWIND indexes AS index
                                WITH recipe, row, trim(ingredients[index]) AS ingredient, trim(quantities[index]) AS quantity
                                WHERE ingredient<>"" AND ingredient IS NOT NULL AND quantity<>"" AND quantity IS NOT NULL
                                MERGE (i:Ingredient {Name:ingredient})
                                MERGE (recipe)-[:CONTAINS {Quantity:quantity}]->(i)

                                WITH recipe, row, row.Keywords AS raw
                                WITH recipe, split(row.Keywords, ",") AS keywords
                                
                                UNWIND keywords AS keyword
                                WITH recipe, trim(keyword) AS keyword
                                WHERE keyword<>"" AND keyword IS NOT NULL
                                MERGE (k:Keyword {Name:keyword})
                                MERGE (recipe)-[:USES_KEYWORD]->(k)
                                } IN TRANSACTIONS OF 5000 ROWS`);
            console.log("Loaded Recipes.csv");

            //Load Reviews
            await session.run(`LOAD CSV WITH HEADERS FROM "file:///reviews.csv" AS row
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

            //Loaded data, setting flag
            await session.run(`MERGE (m:SetupFlag {flag:"SuppersDB_Initialised"})`);
            console.log("Set Initialised_SuppersDB Flag");
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        await session.close();
        await driver.close();
    }
}

module.exports = { neo4j_startup: neo_startup};