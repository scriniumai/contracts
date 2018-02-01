Scrinium - blockchain investing platform.

#### How to connect to ethereum network at app13.appdevstage.com:8545 (contracts should be already deployed)
```
#!/bin/bash
geth attach http://app13.appdevstage.com:8545 --preload ./preload.js
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
> balances.getBalance()
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
