Scrinium - blockchain investing platform.

#### How to connect to ethereum network at app13.appdevstage.com:8545 (contracts should be already deployed)
```
#!/bin/bash
geth attach http://app13.appdevstage.com:8545 --preload ./preload-development.js
```

-----------------------------------

#### How to connect remix with our test network
```
1. Run -> Environment -> Web3.Provider -> OK -> enter "http://app13.appdevstage.com:8545"
2. Allow to load unsafe scripts
```

-----------------------------------

#### How to share local files with remix
```
# 1. install remixd - (once)
npm install -g remixd

# 2. run remixd with path to contracts
remixd -S /apps/contracts/scrinium-contracts # path to your code

# 3. click to chain icon in remix IDE named 'Connect to localhost'
```

-----------------------------------

#### How to deploy contracts
```
# 1. Unlock base account
geth attach http://app13.appdevstage.com:8545 --exec "personal.unlockAccount(eth.accounts[0], '123')"

# 2. run migrations (allready migrated contracts will be rewrited)
truffle migrate

# 3. Connect to console for checking deployed contracts
geth attach http://app13.appdevstage.com:8545 --preload ./preload-development.js

# 4. And try to run some commands such as:
> scrinium.balanceOf(eth.accounts[0]);
> balances.balanceOf(eth.accounts[0])
> platform.openTrade()
```

-----------------------------------

#### How to run tests
```
# 1. Install testrpc (run once)
sudo npm install -g ethereumjs-testrpc
npm install
# 2. Run testrpc in another console - it runs fake and fast rpc network for running unit tests
testrpc
# 3. Run tests on fast network
truffle test --network testing
```

### Allowed methods
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
    Platform.trades.call(_tradeId)
```
