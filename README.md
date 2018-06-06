# Scrinium &mdash; The future of portfolio investment

[![node](https://img.shields.io/badge/node-v8.11.2-50EA3B.svg)](https://nodejs.org/en/docs/)
[![yarn](https://img.shields.io/badge/yarn-v1.6.0-2281BA.svg)](https://yarnpkg.com/lang/en/docs/install/)
[![npm](https://img.shields.io/badge/npm-v6.0.1-DB0031.svg)](https://www.npmjs.com/)
[![truffle](https://img.shields.io/badge/truffle-v4.1.11-00F1C6.svg)](http://truffleframework.com/docs/getting_started/installation)
[![ganache-cli](https://img.shields.io/badge/ganache--cli-v6.1.0-EAAB5E.svg)](https://github.com/trufflesuite/ganache-cli)
[![solidity](https://img.shields.io/badge/solidity-docs-000000.svg)](http://solidity.readthedocs.io/en/develop/introduction-to-smart-contracts.html)

## Installation

We recommend using the latest versions **node**, **npm** и **yarn**.

To install the dependencies (after repo cloning), you must run the following command `yarn install` (`yarn` should be already globally istalled in your system).

## Testing

To run tests you need to execute following commands:

```bash
yarn truffle develop
# Command above will start Truffle Develop terminal
# with already running Ganache private node on 9545 port
truffle(develop)> test
```
*Note:* tests for *Scrinium.sol* contract may fail because of hardcoded ICO timestamps.

## Development

You may run Remix IDE by executing of `yarn remix` command. It will run on http://localhost:8080. To mount local directory with contracts you should click on the chain icon in the IDE and accept prompt.

## Deploying

Before starting the deployment of smart contracts, you must have running Ethereum node (*Geth*, for example) with enabled JSON-RPC option. The network configuration file ***./truffle.js*** should contain information about the connection to this node (`<network_name>: {}`). Base account (field *from* in `<network_name>` section of  ***./truffle.js***) should be unlocked:

```bash
# 1. Unlock base account
geth attach <protocol>://<host>:<port> --exec "personal.unlockAccount(eth.accounts[0], <accountPassPhrase>)"

# 2. Run migrations (contracts that are already migrated will be rewritten)
yarn migrate [--network <network_name>]

# 3. Connect to the console for checking deployed contracts
geth attach <protocol>://<host>:<port> --preload ./preload-<network_name>.js

# 4. Try to run some commands such as:
> scrinium.balanceOf(eth.accounts[0]);
> balances.balanceOf(eth.accounts[0])
> platform.getTradeIds()
```

## Command reference

* `yarn combine` &mdash; combining of smart contract sources to the ***./build/combined/*** directory

* `yarn compile` &mdash; compilation of smart contracts from the ***./contracts/*** directory

* `yarn ganache` &mdash; starting private blockchain (accounts are read from file ***./data/ganache-cli-accounts.json***)

	* `PORT=<port_number>`

* `yarn lint` &mdash; linting contracts code via [Solium](https://www.getsolium.com/) linter

* `yarn migrate [-- --network <network_name>]` &mdash; compilation and deployment of smart contracts in the specified network

	* `TRUFFLE_ARTIFACTS_OUTSIDE_PATHS=<json|module>:<path_1>,<json|module>:<path_N>` &mdash; contracts artifacts (ABIs and addresses) will be written to all files in the paths in specified format (contracts artifacts will be appended to files)

* `yarn remix` &mdash; starting the Remix IDE on http://localhost:8080 with ability to mount local directory with contracts

* `yarn test  [-- --network <network_name> <test_file_name>]` &mdash; testing in the specified network

-----------------------------------

## Allowed methods

```
Scrinium
    function mintToken(address target, uint256 mintedAmount) onlyOwner returns (bool)
    function balanceOf(address _owner) constant returns (uint256)
    function transfer(address _to, uint256 _value) returns (bool)

DemoBalances
    function deposit(uint amount) external
    function balanceOf(address _investor) public view returns(uint256)

Subscriptions
   function subscribe(uint[] _traderIds) external
   function demoSubscribeAndDeposit(uint[] _traderIds, uint _amount) external
   function unsubscribe(uint[] _traderIdsForUnsubscribe) external
   function getTraders() external view returns (uint[])
   function getInvestors(uint _traderId) external view returns (address[])

Platform
    function openTrade (
            uint _tradeId,
            address _investor,
            uint _masterTraderId,
            uint _instrumentId,
            uint _marginPercent,
            uint _leverage,
            uint _cmd,
            uint _openTime,
            uint _openPriceInstrument,
            uint _openPriceSCRBase
        ) external
        Allowed only for liquidProviders

    function closeTrade (
        uint _tradeId,
        uint _closeTime,
        uint _closePriceInstrument,
        uint _closePriceSCRBase
    ) external
        Allowed only for liquidProviders

    function getTradeIds() public view returns (uint[])
```
