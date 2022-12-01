# gpt3Prompt

This stack was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test gpt3Prompt` to execute the unit tests via [Jest](https://jestjs.io).

### Setup

1. Create a .env file in the root of the project with the following variables:

   - OPENAI_API_KEY
   - MEILISEARCH_HOST (for local: http://localhost:7700)
   - DEFAULT_WORKSPACE_ID (for local: WORKSPACE_4KHaz8aziCUiPgctCLtki)

2. Run MeiliSearch - [Docs](https://docs.meilisearch.com/learn/getting_started/quick_start.html#setup-and-installation)

   1. Through HomeBrew:

      ```
        # Update brew and install Meilisearch
          brew update && brew install meilisearch

        # Launch Meilisearch
        meilisearch
      ```

   2. Through Bash:

      ```
        # Install Meilisearch
          curl -L https://install.meilisearch.com | sh

        # Launch Meilisearch
        ./meilisearch
      ```

3. Start gp3Prompt stack

   ```
   yarn nx run-many --target=serve --projects=gpt3Prompt
   ```
