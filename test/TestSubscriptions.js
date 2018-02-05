var Subscriptions = artifacts.require("Subscriptions");
var DemoBalances = artifacts.require("DemoBalances");

var { range } = require('lodash');

contract('Subscriptions', function(accounts) {
  var subscriptions, balances;
  var alice = accounts[0];
  var bob = accounts[1];

  before(async () => {
    balances = await DemoBalances.deployed();
    subscriptions = await Subscriptions.new(balances.address);
  });

  afterEach(async () => {
    await subscriptions.unsubscribe(range(0, 10), {from: alice});
    await subscriptions.unsubscribe(range(0, 10), {from: bob});
    await subscriptions.setSubscriptionsLimit.sendTransaction(50, {from:alice});
  });

  it("subscribe should works correctly", async () => {
    await subscriptions.subscribe.sendTransaction([1,2], {from:alice});
    await subscriptions.subscribe.sendTransaction([3,4], {from:alice});

    var traders = await subscriptions.getTraders({from:alice});
    traders = traders.map((trader) => Number(trader.valueOf())); // cast to int[]
    assert.deepEqual(traders, [1,2,3,4]);
  });

  it("subscribe should works correctly for duplicates", async () => {
    await subscriptions.subscribe.sendTransaction([1,2], {from:alice});
    await subscriptions.subscribe.sendTransaction([2,3], {from:alice});

    var traders = await subscriptions.getTraders({from:alice});
    traders = traders.map((trader) => Number(trader.valueOf())); // cast to int[]
    assert.deepEqual(traders, [1,2,3]);
  });

  it("getInvestors should works correctly", async () => {
    await subscriptions.subscribe.sendTransaction([1,2,3,4], {from:alice});
    await subscriptions.subscribe.sendTransaction([1,5], {from:bob});

    assert.deepEqual(await subscriptions.getInvestors(1), [alice,bob]);
    assert.deepEqual(await subscriptions.getInvestors(2), [alice]);
    assert.deepEqual(await subscriptions.getInvestors(5), [bob]);
  });

  it("unsubscribe should works correctly", async () => {
    await subscriptions.subscribe.sendTransaction([1,2,3,4,5], {from:alice});
    await subscriptions.subscribe.sendTransaction([1,2,3,4,5], {from:bob});
    await subscriptions.unsubscribe.sendTransaction([1,3], {from:alice});
    await subscriptions.unsubscribe.sendTransaction([2,4], {from:bob});

    var traders = await subscriptions.getTraders({from:bob});
    traders = traders.map((trader) => Number(trader.valueOf())).sort(); // cast to int[]
    assert.deepEqual(traders, [1,3,5]);

    assert.deepEqual(await subscriptions.getInvestors(1), [bob]);
    assert.deepEqual(await subscriptions.getInvestors(2), [alice]);
    assert.deepEqual(await subscriptions.getInvestors(3), [bob]);
    assert.deepEqual(await subscriptions.getInvestors(4), [alice]);
    assert.deepEqual(await subscriptions.getInvestors(5), [alice,bob]);
    assert.deepEqual(await subscriptions.getInvestors(6), []);
  });

  it("setSubscriptionsLimit should works correctly", async () => {
    await subscriptions.setSubscriptionsLimit.sendTransaction(33, {from:alice});
    assert.equal(await subscriptions.subscriptionsLimit.call(), 33);

    await subscriptions.setSubscriptionsLimit.sendTransaction(99, {from:alice});
    assert.equal(await subscriptions.subscriptionsLimit.call(), 99);
  });


  it("subscriptionsLimit - cannot subscribe over limit", async () => {
    await subscriptions.setSubscriptionsLimit.sendTransaction(3, {from:alice});

    try {
      await subscriptions.subscribe.sendTransaction([1,2,3,4], {from:bob}); // subscribe over limit
      assert.fail('Investor cannot subscribe over limit');
    } catch (err) {}

    // check that operation has been reverted
    assert.equal(
      (await subscriptions.getTraders({from:bob})).length,
      0
    );
  });


  it("subscriptionsLimit - cannot subscribe over limit when already has subscriptions", async () => {
    await subscriptions.setSubscriptionsLimit.sendTransaction(3, {from:alice});

    await subscriptions.subscribe.sendTransaction([1,2,3], {from:bob});

    assert.equal(
      (await subscriptions.getTraders({from:bob})).length,
      3
    );

    try {
      await subscriptions.subscribe.sendTransaction([4], {from:bob}); // subscribe over limit
      assert.fail('Investor cannot subscribe over limit');
    } catch (err) {}

    // check that operation has been reverted
    assert.equal(
      (await subscriptions.getTraders({from:bob})).length,
      3
    );
  });


  it("getCountOfInvestorsByTraderId should works correctly", async () => {
    await subscriptions.subscribe.sendTransaction([1,2], {from:alice});
    await subscriptions.subscribe.sendTransaction([2,3], {from:bob});

    assert.equal(await subscriptions.getCountOfInvestorsByTraderId(1), 1);
    assert.equal(await subscriptions.getCountOfInvestorsByTraderId(2), 2);
    assert.equal(await subscriptions.getCountOfInvestorsByTraderId(3), 1);
    assert.equal(await subscriptions.getCountOfInvestorsByTraderId(4), 0);
  });

  it("demoSubscribeAndDeposit should works correctly", async () => {
    await subscriptions.demoSubscribeAndDeposit([1,2,4], 12499, {from:bob})

    var traders = await subscriptions.getTraders({from:bob});
    traders = traders.map((trader) => Number(trader.valueOf())); // cast to int[]
    assert.deepEqual(traders, [1,2,4]);

    assert.equal((await balances.getBalanceOf(bob)).valueOf(), '12499');
  });

});
