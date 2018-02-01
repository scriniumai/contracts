var Subscriptions = artifacts.require("Subscriptions");
var Platform = artifacts.require("Platform");
var DemoBalances = artifacts.require("DemoBalances");

var { range } = require('lodash');

contract('Platform', function(accounts) {
  var subscriptions, platform, balances;
  var alice = accounts[0];
  var bob = accounts[1];

  before(async () => {
    subscriptions = await Subscriptions.deployed();
    balances = await DemoBalances.deployed();

    platform = await Platform.new(subscriptions.address, balances.address);
  });

  afterEach(async () => {
    await subscriptions.unsubscribe(range(0, 10), {from: alice});
    await subscriptions.unsubscribe(range(0, 10), {from: bob});
  });

  it("openTrade should works correctly", async () => {
    const TRADE_ID = 111;
    const TRADER_ID = 1;

    await balances.deposit.sendTransaction(1000 * 10**8, {from:alice});
    await subscriptions.subscribe.sendTransaction([1], {from:alice});

    try {
      await platform.openTrade.sendTransaction(
        TRADE_ID,
        TRADER_ID,
        'EURUSD',     // instrument
        1234567890,   // openTime
        '1.12345',    // openPrice
        10,           // volume as percent = 1/100
        {
          from: alice
        }
      );
    } catch (err) {
      // console.log(err);
      assert.fail(err);
    }

    var trade = [
      traderId,
      instrument,
      openTime,
      openPrice,
      closeTime,
      closesPrice,
      investedPart,
      returnProfit,
      status
    ] = await platform.trades.call(TRADE_ID);

    // check trade
    assert.equal(traderId.valueOf(), TRADER_ID);
    assert.equal(status, 1); //opened //@ todo: use contant
    assert.equal(investedPart.valueOf(), 10); // 10 percents

    var [
        investor,
        investedAmount,
        profitAmount
      ] = await platform.tradeIdInvestings.call(TRADE_ID, 0);

    assert.equal(investor, alice); //opened //@ todo: use contant
    assert.equal(investedAmount.valueOf(), 100 * 10**8); // 10 percents of 1000 * 10**8
    assert.equal(profitAmount.valueOf(), 0); // 10 percents of 1000 * 10**8

    // Alice's balance = 900 SCR
    assert.equal(
      (await balances.getBalanceOf(alice)).valueOf(),
      String( 900 * Math.pow(10, 8))
    );

    // Our balance = 100 SCR
    assert.equal(
      (await balances.getBalanceOf(balances.address)).valueOf(),
      String( 100 * Math.pow(10, 8))
    );

  });


});
