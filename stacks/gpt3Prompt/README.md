# gpt3Prompt

This stack was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test gpt3Prompt` to execute the unit tests via [Jest](https://jestjs.io).

### Setup

1.  Create a .env file in the root of the project with the following variables:

    - OPENAI_API_KEY
    - MEILISEARCH_HOST (for local: http://localhost:7700)
    - DEFAULT_WORKSPACE_ID (for local: WORKSPACE_4KHaz8aziCUiPgctCLtki)

2.  MeiliSearch Setup

    1.  Run MeiliSearch - [Docs](https://docs.meilisearch.com/learn/getting_started/quick_start.html#setup-and-installation)

        a. Through HomeBrew:

        ```
          # Update brew and install Meilisearch
            brew update && brew install meilisearch

          # Launch Meilisearch
          meilisearch
        ```

        b. Through Bash:

        ```
          # Install Meilisearch
            curl -L https://install.meilisearch.com | sh

          # Launch Meilisearch
          ./meilisearch
        ```

    2.  Configure MeiliSearch for searchable, filtering and sorting attributes.
        Docs -

        1. [Fine Tune](https://docs.meilisearch.com/learn/getting_started/customizing_relevancy.html)
        2. [Filtering/Sorting](https://docs.meilisearch.com/learn/getting_started/filtering_and_sorting.html)

        Configurations: Make this curl request to your MeiliSearch instance.

        ```
            curl --location --request PATCH 'http://localhost:7700/indexes/gpt3Prompt/settings' \
            --header 'Content-Type: application/json' \
            --data-raw '{
                    "searchableAttributes": [
                        "title", "description", "category", "tags", "showcase", "createdBy.name"
                    ],
                    "filterableAttributes": [
                        "category", "createdAt", "createdBy.id", "tags", "updatedAt"
                    ],
                    "sortableAttributes": [
                        "likes", "views", "downloads", "updatedAt", "createdAt"
                    ]
               }'
        ```

3.  Start gp3Prompt stack

    ```
    yarn nx run-many --target=serve --projects=gpt3Prompt
    ```
