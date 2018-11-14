const debug = require('debug')('test:Subscriptions')

const Scrinium = artifacts.require("Scrinium")
const Subscriptions = artifacts.require("Subscriptions")
const Balances = artifacts.require("Balances")

const { range } = require('lodash')

contract('Subscriptions', function(accounts) {
  const ALICE = accounts[0]
  const BOB = accounts[1]

  const BALANCE_BEFORE = 1000 * 10 ** 8
  const TRADERS_IDS_RANGE = range(0, 10)

  let subscriptions
  let balances

  before(async () => {
    scrinium = await Scrinium.deployed()
    balances = await Balances.deployed()
    subscriptions = await Subscriptions.deployed()

    for (const investor of [ALICE, BOB]) {
      await scrinium.mintToken.sendTransaction(investor, BALANCE_BEFORE, { from: ALICE })
      await scrinium.approve.sendTransaction(balances.address, BALANCE_BEFORE, { from: investor })
      await balances.deposit.sendTransaction(Date.now(), BALANCE_BEFORE, { from: investor })
    }
  })

  afterEach(async () => {
    await subscriptions.unsubscribe(TRADERS_IDS_RANGE, { from: ALICE })
    await subscriptions.unsubscribe(TRADERS_IDS_RANGE, { from: BOB })
    await subscriptions.setSubscriptionsLimit.sendTransaction(
      await subscriptions.subscriptionsLimit.call(),
      { from: ALICE },
    )
  })

  it("subscribe should works correctly", async () => {
    await subscriptions.subscribe.sendTransaction([1,2], { from: ALICE })
    await subscriptions.subscribe.sendTransaction([3,4], { from: ALICE })

    let traders = await subscriptions.getTraders(ALICE)
    traders = traders.map((trader) => trader.toNumber()) // cast to int[]
    assert.deepEqual(traders, [1,2,3,4])
    assert.deepEqual(await subscriptions.investorsWithPortfolios.call(ALICE), true)
    assert.isBelow((await subscriptions.investorLastPortfolioDate.call(ALICE)).toNumber(), Date.now() / 1000)
  })

  it("subscribe should works correctly for duplicates", async () => {
    await subscriptions.subscribe.sendTransaction([1,2], { from: ALICE })
    await subscriptions.subscribe.sendTransaction([2,3], { from: ALICE })

    let traders = await subscriptions.getTraders(ALICE)
    traders = traders.map((trader) => trader.toNumber()) // cast to int[]
    assert.deepEqual(traders, [1,2,3])
  })

  it("getInvestors should works correctly", async () => {
    await subscriptions.subscribe.sendTransaction([1,2,3,4], { from: ALICE })
    await subscriptions.subscribe.sendTransaction([1,5], { from: BOB })

    assert.deepEqual(await subscriptions.getInvestors(1), [ALICE,BOB])
    assert.deepEqual(await subscriptions.getInvestors(2), [ALICE])
    assert.deepEqual(await subscriptions.getInvestors(5), [BOB])
  })

  it("unsubscribe should works correctly", async () => {
    await subscriptions.subscribe.sendTransaction([1,2,3,4,5], { from: ALICE })
    await subscriptions.subscribe.sendTransaction([1,2,3,4,5], { from: BOB })
    await subscriptions.unsubscribe.sendTransaction([1,3], { from: ALICE })
    await subscriptions.unsubscribe.sendTransaction([2,4], { from: BOB })
    await subscriptions.unsubscribe.sendTransaction([2,4,5], { from: ALICE })
    await subscriptions.subscribe.sendTransaction([6], { from: ALICE })

    let traders = await subscriptions.getTraders(BOB)
    traders = traders.map((trader) => trader.toNumber()).sort() // cast to int[]
    assert.deepEqual(traders, [1,3,5])

    assert.deepEqual(await subscriptions.getInvestors(1), [BOB])
    assert.deepEqual(await subscriptions.getInvestors(2), [])
    assert.deepEqual(await subscriptions.getInvestors(3), [BOB])
    assert.deepEqual(await subscriptions.getInvestors(4), [])
    assert.deepEqual(await subscriptions.getInvestors(5), [BOB])
    assert.deepEqual(await subscriptions.getInvestors(6), [ALICE])
    assert.deepEqual(await subscriptions.getInvestors(7), [])
  })

  it("setSubscriptionsLimit should works correctly", async () => {
    await subscriptions.setSubscriptionsLimit.sendTransaction(33, { from: ALICE })
    assert.equal(await subscriptions.subscriptionsLimit.call(), 33)

    await subscriptions.setSubscriptionsLimit.sendTransaction(99, { from: ALICE })
    assert.equal(await subscriptions.subscriptionsLimit.call(), 99)
  })


  it("subscriptionsLimit - cannot subscribe over limit", async () => {
    await subscriptions.setSubscriptionsLimit.sendTransaction(3, { from: ALICE })

    try {
      await subscriptions.subscribe.sendTransaction([1,2,3,4], { from: BOB }) // subscribe over limit
      assert.fail('Investor cannot subscribe over limit')
    } catch (error) {}

    // check that operation has been reverted
    assert.equal(
      (await subscriptions.getTraders(BOB)).length,
      0
    )
  })


  it("subscriptionsLimit - cannot subscribe over limit when already has subscriptions", async () => {
    await subscriptions.setSubscriptionsLimit.sendTransaction(3, { from: ALICE })

    await subscriptions.subscribe.sendTransaction([1,2,3], { from: BOB })

    assert.equal(
      (await subscriptions.getTraders(BOB)).length,
      3
    )

    try {
      await subscriptions.subscribe.sendTransaction([4], { from: BOB }) // subscribe over limit
      assert.fail('Investor cannot subscribe over limit')
    } catch (error) {}

    // check that operation has been reverted
    assert.equal(
      (await subscriptions.getTraders(BOB)).length,
      3
    )
  })

  it("getCountOfInvestorsByTraderId should works correctly", async () => {
    await subscriptions.subscribe.sendTransaction([1,2], { from: ALICE })
    await subscriptions.subscribe.sendTransaction([2,3], { from: BOB })

    assert.equal(await subscriptions.getCountOfInvestorsByTraderId(1), 1)
    assert.equal(await subscriptions.getCountOfInvestorsByTraderId(2), 2)
    assert.equal(await subscriptions.getCountOfInvestorsByTraderId(3), 1)
    assert.equal(await subscriptions.getCountOfInvestorsByTraderId(4), 0)
  })

})
