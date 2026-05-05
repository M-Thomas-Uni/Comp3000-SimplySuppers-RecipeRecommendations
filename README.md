# Comp3000 Project, Simply Suppers - A Graph-Based Recipe Recommendation System.
This is a prototype recipe recommendation system, using NodeJS, Express and a Neo4j Graph database. Built as part of a year long project for COMP3000.

## Overview
Simply Suppers is a lightweight recipe recommender, implementing content-based filtering through TF-IDF weightings and cosine similarity, with precomputed normal vectors saved in the graph structure. A simple EJS templating based frontend lets users browse popular recipes, explore categories and keywords, and view recommendations based on similarities.

## Dependencies & Additional Sources
To run this project, you must install:

- **[Docker](https://www.docker.com/)** - Alternatively, upload the project to a docker-compatible cloud hosting platform. 
- **[Neo4j Desktop](https://neo4j.com/download/)** - Not necessary, unless you want to be able to connect to the database directly from your computer.

No additional setup should be required before running the program, other than installing Docker (and its dependencies for your platform) and ensuring it is running.

---

## Running the application
Using Git Bash:
 - Navigate to the repository.
 - Locate rebuild.sh and up.sh
 - Run "source rebuild.sh"
From terminal/powershsell:
 - Navigate to the repository.
 - Locate rebuild.sh and up.sh
 - Run "bash"
 - Run "source rebuild.sh"

<b>Troubleshooting
The App-Backend container is set to wait for the Database to become healthy before starting. In some cases, it might run out of patience before the database is ready.
If you find the backend does not start, either run "source rebuild.sh" again, or manually press the start/restart button for the backend container in the Docker Desktop window.
If you recieve issues relating to credentials, ensure you have the latest version of docker. You may need to restart the docker engine, and/or exit and re-enter the Bash console.
If you recieve an error message relating to a file already existing or not existing, during container building, place an empty folder named "data" within the suppers-db/ folder, besides /import.
---

## Video Overview
The following is a link to a Youtube video. This is the video uploaded to the Pebblepad ePortfolio.

[![IMAGE ALT TEXT HERE]()]()
