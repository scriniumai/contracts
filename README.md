# Scrinium &mdash; The future of portfolio investment

[![node](https://img.shields.io/badge/node-v10.15.0-50EA3B.svg)](https://nodejs.org/en/docs/)
[![yarn](https://img.shields.io/badge/yarn-v1.13.0-2281BA.svg)](https://yarnpkg.com/lang/en/docs/install/)
[![npm](https://img.shields.io/badge/npm-v6.5.0-DB0031.svg)](https://www.npmjs.com/)
[![truffle](https://img.shields.io/badge/truffle-v5.0.1-00F1C6.svg)](http://truffleframework.com/docs/getting_started/installation)
[![ganache-cli](https://img.shields.io/badge/ganache--cli-v6.1.0-EAAB5E.svg)](https://github.com/trufflesuite/ganache-cli)
[![solidity](https://img.shields.io/badge/solidity-docs-000000.svg)](http://solidity.readthedocs.io/en/develop/introduction-to-smart-contracts.html)

## Installation

We recommend using the latest versions **node**, **npm** и **yarn**.

To install the dependencies (after repo cloning), you must run the following command `yarn install` (`yarn` should be already globally istalled in your system).

## Configuring

### Networks

By default, project is configured to use the *development* network:

```javascript
{
  host: '127.0.0.1',
  port: 8545,
  network_id: 5777,
  gas: 3 * 10**6,
  gasPrice: 20 * 10**9
}
```

For overriding any values of the *development* network, you must create a file ***./config/networks/development.js*** which exports the overridden directives, for example:

```javascript
module.exports = {
  host: '172.0.0.1',
  port: 8646,
  gasPrice: 10 * 10**9
}
```

To add a new network, you must create a file named as the network, for example, ***./config/networks/live.js***:

```javascript
module.exports = {
  host: '8.8.8.8',
  port: 8747,
  network_id: '*',
  gas: 2 * 10**6,
  gasPrice: 10 * 10**9
}
```

By default transactions are signing by the first unlocked account of the node. For specifiyng a different account, you must add the `from: <unlocked_address>` directive.

### Deploy

By default, it comes with deployment configuration for *develop* and *development* networks — ***./config/deploy/develop.js*** and ***./config/deploy/development.js***.

| Property                                       | Required | Type       | Description
| ---------------------------------------------- | :------: | :--------: | -----------
| commissionsAddress                             | &middot; | `String`   | Address for *LiquidityProvider* commissions

## Development

You may run Remix IDE by executing of `yarn remix` command. It will run on http://localhost:8080. To mount local directory with contracts you should click on the chain icon in the IDE and accept prompt.

## Testing

To run tests you need to execute following commands:

```bash
yarn truffle develop
# Command above will start Truffle Develop terminal
# with already running Ganache private node on 9545 port
truffle(develop)> test
```
*Note:* tests for *Scrinium.sol* contract may fail because of hardcoded ICO timestamps.

## Deployment

Before starting the deployment of smart contracts, you must have running Ethereum node (*Geth*, for example, or *Ganache*) with enabled JSON-RPC option.

The network configuration ***./config/networks/&lt;network_name&gt;.js*** and deploy configuration ***./config/deploy/&lt;network_name&gt;.js*** should exist.

Base account (field `from` in the network configuration) should be unlocked.

### In case of Ganache

```bash
# 1. Run Ganache in a separate tab
[PORT=<port>] yarn ganache # 8545 port by default

# 2. Run migrations (contracts that are already migrated will be rewritten)
[NETWORK=<network_name>] yarn migrate # development network on 8545 port by default
```

### In case of Geth

```bash
# 1. Unlock base account
geth attach <protocol>://<host>:<port> --exec "personal.unlockAccount(eth.accounts[0], <accountPassPhrase>)"

# 2. Run migrations (contracts that are already migrated will be rewritten)
NETWORK=<network_name> yarn migrate

# 3. Connect to the console for checking deployed contracts
geth attach <protocol>://<host>:<port> --preload ./preload-<network_name>.js

# 4. Try to run some commands such as:
> scrinium.balanceOf(eth.accounts[0]);
> balances.balanceOf(eth.accounts[0])
> platform.getTradeIds()
```

### In case of Infura

You may deploy contracts via [Infura](https://infura.io) (to [Ropsten](https://ropsten.etherscan.io/), [Rinkeby](https://rinkeby.etherscan.io/), [Kovan](https://kovan.etherscan.io/) or [Mainnet](https://etherscan.io/) networks) by running `yarn migrate` with additional environment variables:

```bash
NETWORK=<network_name> \
INFURA_ACCESS_TOKEN=<infura_access_token> \
<NETWORK_NAME>_PRIVATE_KEY=<account_private_key> \
yarn migrate
```

## Command reference

* `yarn combine` &mdash; combining of smart contract sources to the ***./build/combined/*** directory

* `yarn compile` &mdash; compilation of smart contracts from the ***./contracts/*** directory

* `yarn ganache` &mdash; starting private blockchain (accounts are read from file ***./data/ganache-cli-accounts.json***)

	* `HOST=<hostname_arg>`
	* `PORT=<port_arg>`
	* `NETWORK_ID=<networkId_arg>`

* `yarn lint` &mdash; linting contracts code via [Solium](https://www.getsolium.com/) linter

* `yarn migrate` &mdash; compilation and deployment of smart contracts in the specified network

    * `NETWORK=<network_name>`
    * `TRUFFLE_GAS=<gas_limit>`
    * `TRUFFLE_GAS_PRICE=<gas_price_in_wei>`
    * `TRUFFLE_ARTIFACTS_OUTSIDE_PATHS=<json|module|yaml>:<path_1>,...,<json|module|yaml>:<path_N>` &mdash; contracts artifacts (ABIs and addresses) will be written to all files in the paths in specified format (*it will be appended to files [plain JSON, CommonJS module or YAML file]*)
    * `TRUFFLE_MIGRATIONS_OMIT=<migration_number_1>,...,<migration_number_N>` &mdash; specified migrations will be omitted
    * `INFURA_ACCESS_TOKEN=<infura_access_token>`
    * `<INFURA_NETWORK_NAME>_PRIVATE_KEY=<account_private_key>`

* `yarn remix` &mdash; starting the Remix IDE on http://localhost:8080 with ability to mount local directory with contracts

* `yarn test  [-- --network <network_name> <test_file_name>]` &mdash; testing in the specified network
