var Subscriptions = artifacts.require("Subscriptions");
var Platform = artifacts.require("Platform");
var DemoBalances = artifacts.require("DemoBalances");
var Instruments = artifacts.require("Instruments");

var { range } = require('lodash');

contract('Platform', function(accounts) {
  var subscriptions, instruments, balances;

  var alice = accounts[0]; // owner
  var bob = accounts[1]; // investor
  const LIQUID_PROVIDER = accounts[3]; //liquidProvider

  const STATUS_OPENED = 2;
  const STATUS_CLOSED = 3;

  const INSTRUMENT_ID = 2; // EURUSD

  before(async () => {
    subscriptions = await Subscriptions.deployed();
    balances = await DemoBalances.deployed();

    instruments = await Instruments.deployed();
    await instruments.add(INSTRUMENT_ID, 'EURUSD', 1);
  });

  afterEach(async () => {
    // clean balances
    await balances.withdrawal.sendTransaction(await balances.balanceOf(bob), {from: bob});
  });

  const CMD_BUY = 0;
  const CMD_SELL = 1;

  var openTradeAssertions = [
    {tradeId: 111, masterTradeId: 222, cmd: CMD_BUY, pips: +10, balanceBefore: 100, expectedProfit: 0.14 },
    {tradeId: 112, masterTradeId: 222, cmd: CMD_BUY, pips: -10, balanceBefore: 100, expectedProfit: -0.14 },
    {tradeId: 113, masterTradeId: 222, cmd: CMD_BUY, pips: -1000, balanceBefore: 100, expectedProfit: -14 },
    {tradeId: 114, masterTradeId: 222, cmd: CMD_BUY, pips: +1,    balanceBefore: 100, expectedProfit: 0.014 },
    {tradeId: 115, masterTradeId: 222, cmd: CMD_BUY, pips: 0,   balanceBefore: 100, expectedProfit: 0 },

    {tradeId: 116, masterTradeId: 222, cmd: CMD_SELL, pips: +10,   balanceBefore: 100, expectedProfit: -0.14 },
    {tradeId: 117, masterTradeId: 222, cmd: CMD_SELL, pips: -100,   balanceBefore: 100, expectedProfit: 1.4 },
  ];

  openTradeAssertions.forEach(({tradeId, masterTradeId, cmd, pips, balanceBefore, expectedProfit}) => {
    it(`openTrade should works correctly for tradeId:${tradeId}`, async () => {
      var platform = await Platform.new(subscriptions.address, balances.address);
      platform.setInstrumentsAddress(instruments.address, {from: alice});
      platform.setAllowedLiquidProvider(LIQUID_PROVIDER, {from: alice});
      balances.setPlatformAddress(platform.address, {from: alice});

      await balances.deposit.sendTransaction(balanceBefore * 10**8, {from:bob});

      try {
        await platform.openTrade.sendTransaction(
          tradeId,
          bob,              // investor
          masterTradeId,

          INSTRUMENT_ID,
          28,             // uint _marginPercent,
          500,            // uint _leverage,
          cmd,

          1234567890,               // uint _openTime,
          1300000,                  // _openQuoteInstrument
          parseInt(5000000/1.4)+1,  // SCR BaseCurrency * 10**6
          {
            from: LIQUID_PROVIDER
          }
        );
      } catch (err) {
        console.log(err);
        assert.fail(err);
      }

      var trade = [
        liquidProviderAddress,
        investor,
        masterTraderId,

        instrumentId,
        marginPercent,
        leverage,
        existingCmd,

        marginSCR,
        profitSCR,
        status
      ] = await platform.trades.call(tradeId);
      assert.equal(liquidProviderAddress, LIQUID_PROVIDER);
      assert.equal(investor, bob);
      assert.equal(masterTraderId, masterTradeId);
      assert.equal(instrumentId, INSTRUMENT_ID);
      assert.equal(marginPercent, 28);
      assert.equal(leverage, 500);
      assert.equal(existingCmd, cmd);

      assert.equal(marginSCR.valueOf(), 28 * 10**8);
      assert.equal(profitSCR.valueOf(), 0);

      assert.equal(status, STATUS_OPENED);

      // check quotes
      var tradeQuotes = [
        openTime, openPriceInstrument, openPriceSCRBaseCurrency,
        closeTime, closePriceInstrument, closePriceSCRBaseCurrency,
      ] = await platform.tradeQuotes.call(tradeId);
      assert.equal(openTime, 1234567890);
      assert.equal(openPriceInstrument.valueOf(), 1300000);
      assert.equal(openPriceSCRBaseCurrency, parseInt(5000000/1.4)+1);
      assert.equal(closeTime, 0);
      assert.equal(closePriceInstrument, 0);
      assert.equal(closePriceSCRBaseCurrency, 0);

      // //only one trade in array
      assert.deepEqual(
        (await platform.getTradeIds()).map((item) => Number(item.valueOf())),
        [tradeId]
      );

      // bob's balance was not changed = 1000 SCR
      assert.equal(
        (await balances.balanceOf(bob)).valueOf(),
        balanceBefore * 10**8
      );

      try {
        await platform.closeTrade.sendTransaction(
          tradeId,                 // tradeId
          1234567890,               // uint _openTime,
          1300000 + pips,                  // _closeQuoteInstrument // changed with 1pips (10**-5)
          parseInt(5000000/1.4)+1,  // SCRBase
          {
            from: LIQUID_PROVIDER
          }
        );
      } catch (err) {
        console.log('closeTrade', err);
        assert.fail(err);
      }

      var trade = [
        liquidProviderAddress,
        investor,
        masterTraderId,

        instrumentId,
        marginPercent,
        leverage,
        existingCmd,

        marginSCR,
        profitSCR,
        status
      ] = await platform.trades.call(tradeId);

      assert.equal(parseInt(profitSCR), parseInt(expectedProfit * 10**8)); // in SCR cents
      assert.equal(status, STATUS_CLOSED, 'status should be closed');

      // bob's balance changed
      assert.equal((await balances.balanceOf(bob)).valueOf(), parseInt((balanceBefore + expectedProfit) * 10**8));
    });
  });

  // @todo: add test: openTrade and closeTrade allowed only for platform
});
