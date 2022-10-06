# entities-monorepo

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![](https://img.shields.io/badge/monorepo-Nx-blue)](https://nx.dev/)
![npm peer dependency version (scoped)](https://img.shields.io/npm/dependency-version/eslint-config-prettier/peer/eslint)
![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)

## Table of contents

---

- [Template Layout](#template-layout)
- [Prerequisites](#prerequisites)
- [Usage](#usage)
- [Further help](#further-help)
- [Nx Cloud](#nx-cloud)

## Template Layout

---

```shell
.
├── stacks/    # stack for each serverless configuration/template and its associated files
├── libs/      # shared libraries
├── tools/
├── README.md
├── jest.config.js
├── jest.preset.js
├── nx.json
├── package.json
├── serverless.base.ts  # base configuration for serverless
├── tsconfig.base.json
├── workspace.json
├── .editorconfig
├── .eslintrc.json
├── .gitignore
├── .husky              # git hooks
├── .nvmrc
├── .prettierignore
├── .prettierrc
```

## Prerequisites

---

- [Nodejs](https://nodejs.org/) `protip: use nvm`

  > :warning: **Version**: `lts/fermium (v.14.17.x)`. If you're using [nvm](https://github.com/nvm-sh/nvm), run `nvm use` to ensure you're using the same Node version in local and in your lambda's runtime.

- :package: Package Manager

  - [Yarn](https://yarnpkg.com)

    (or)

  - NPM `Pre-installed with Nodejs`

- 💅 Code format plugins

  - [Eslint](https://eslint.org/)
  - [Prettier](https://prettier.io/)
  - [EditorConfig](https://editorconfig.org/)

  > On your preferred code editor, Install plugins for the above list of tools

## Usage

---

Install project dependencies

- Using Yarn

```shell
yarn
```

  <details>
  <summary>Generate a new stack</summary>

```shell
nx workspace-generator serverless <STACK_NAME>
```

> Set the basePath of the custom domain manager for each new stack in serverless.ts file

> Stack name shouldn't include special characters or whitespaces

> Run with `-d` or `--dry-run` flag for dry run

</details>

<details>
<summary>Generate new library</summary>

```shell
nx g @nrwl/node:lib --skipBabelrc --tags lib <LIBRARY_NAME>
```

> Stack name shouldn't include special characters or whitespaces

> Run with `-d` or `--dry-run` flag for dry run

</details>

<details>
<summary>Package stack</summary>

- To package single stack

  ```shell
  nx run <STACK_NAME>:build --stage=<STAGE_NAME>
  ```

- To package stack affected by a change

  ```shell
  nx affected:build --stage=<STAGE_NAME>
  ```

- To package all stacks

      ```shell
      nx run-many --target=build --stage=<STAGE_NAME>
      ```

  </details>
  <details>
  <summary>Deploy stack to cloud</summary>

- To deploy single stack

  ```shell
  nx run <STACK_NAME>:deploy --stage=<STAGE_NAME>
  ```

- To deploy stack affected by a change

  ```shell
  nx affected:deploy --stage=<STAGE_NAME>
  ```

- To deploy all stacks

      ```shell
      nx run-many --target=deploy --all --stage=<STAGE_NAME>
      ```

  </details>

<details>
- **Remove stack from cloud**

- To remove single stack

  ```shell
  nx run <STACK_NAME>:remove --stage=<STAGE_NAME>
  ```

- To remove stack affected by a change

  ```shell
  nx affected:remove --stage=<STAGE_NAME>
  ```

- To remove all stacks

      ```shell
      nx run-many --target=remove --all --stage=<STAGE_NAME>
      ```

  </details>

<details>
<summary>Run tests</summary>

- To run tests in single stack

  ```shell
  nx run <STACK_NAME>:test --stage=<STAGE_NAME>
  ```

- To run tests affected by a change

  ```shell
  nx affected:test --stage=<STAGE_NAME>
  ```

- To run tests in all stacks

      ```shell
      nx run-many --target=test --all --stage=<STAGE_NAME>
      ```

  </details>

<details>
<summary>Run offline / locally</summary>

- To run offlline, configure `serverless-offline` plugin as documented [here](https://github.com/dherault/serverless-offline) and run below command

      ```shell
      nx run <STACK_NAME>:serve --stage=<STAGE_NAME>
      ```

  </details>

<details>
<summary>Understand your workspace</summary>

```
nx dep-graph
```

</details>

## Further help

- Visit [Serverless Documentation](https://www.serverless.com/framework/docs/) to learn more about Serverless framework
- Visit [Nx Documentation](https://nx.dev) to learn more about Nx dev toolkit
- Why NX, not Lerna? Read [here](https://blog.nrwl.io/migrating-from-lerna-to-nx-better-dev-ergonomics-much-faster-build-times-da76ff14ccbb) from co-founder of Nx

## Nx Cloud

---

##### Computation Memoization in the Cloud

​ Nx Cloud pairs with Nx in order to enable you to build and test code more rapidly, by up to 10 times.

​ Visit [Nx Cloud](https://nx.app/) to learn more and enable it

> Currently not active
