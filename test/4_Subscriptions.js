const debug = require('debug')('test:Subscriptions')

const Scrinium = artifacts.require('Scrinium')
const Subscriptions = artifacts.require('Subscriptions')
const Balances = artifacts.require('Balances')

const { range } = require('lodash')

contract('Subscriptions', function(accounts) {
  const ALICE = accounts[0]
  const BOB = accounts[1]

  const BALANCE_BEFORE = 1000 * 10 ** 8
  const TRADERS_IDS = range(1, 10)

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
    await subscriptions.unsubscribe(TRADERS_IDS, { from: ALICE })
    await subscriptions.unsubscribe(TRADERS_IDS, { from: BOB })

    await subscriptions.setSubscriptionsLimit.sendTransaction(
      await subscriptions.SUBSCRIPTIONS_LIMIT.call(),
      { from: ALICE },
    )
  })

  const getInvestors = async (_traderId = 0, _investors = []) => {
    const possibleInvestors = await subscriptions.getInvestors(_traderId)

    const actualInvestors = []

    for (const account of _investors) {
      if (
        possibleInvestors.includes(account) &&
        await subscriptions.isInvestorActualForTraderId(_traderId, account)
      ) {
        actualInvestors.push(account)
      }
    }

    return actualInvestors
  }

  it('`.subscribe()`, `.getInvestors`, `.isInvestorActualForTraderId()` should works correctly', async () => {
    const txHash = await subscriptions.subscribe.sendTransaction(TRADERS_IDS, { from: ALICE })
    const receipt = await web3.eth.getTransactionReceipt(txHash)

    debug('`subscriptions.subscribe()` on empty storage gasUsed %d', receipt.gasUsed)

    const isWithPortfolio = await subscriptions.investorsWithPortfolios.call(ALICE)
    assert.isTrue(isWithPortfolio)

    const lastPortfolioBlock = (await subscriptions.getInvestorLastPortfolioBlock(ALICE)).toNumber()
    assert.equal(lastPortfolioBlock, web3.eth.blockNumber)

    const lastPortfolioDate = (await subscriptions.getInvestorLastPortfolioDate(ALICE)).toNumber()
    assert.isBelow(lastPortfolioDate, Date.now() / 1000)

    const traders = (await subscriptions.getTraders(ALICE)).map(trader => trader.toNumber())
    assert.deepEqual(traders, TRADERS_IDS)

    await subscriptions.subscribe.sendTransaction(TRADERS_IDS, { from: BOB })

    for (const traderId of TRADERS_IDS) {
      assert.deepEqual(await getInvestors(traderId, [ALICE, BOB]), [ALICE, BOB])
    }
  })

  it('`.unsubscribe()` should works correctly', async () => {
    await subscriptions.subscribe.sendTransaction([1,2,3,4,5], { from: ALICE })

    var txHash = await subscriptions.unsubscribe.sendTransaction([1,3], { from: ALICE })
    var receipt = await web3.eth.getTransactionReceipt(txHash)

    debug('`subscriptions.unsubscribe()` gasUsed %d', receipt.gasUsed)

    var  tradersALICE = (await subscriptions.getTraders(ALICE)).map(trader => trader.toNumber())
    assert.deepEqual(tradersALICE, [5, 2, 4])

    var txHash = await subscriptions.subscribe.sendTransaction([6, 7], { from: ALICE })
    var receipt = await web3.eth.getTransactionReceipt(txHash)

    debug('`subscriptions.subscribe()` on non-empty storage gasUsed %d', receipt.gasUsed)

    var  tradersALICE = (await subscriptions.getTraders(ALICE)).map(trader => trader.toNumber())
    assert.deepEqual(tradersALICE, [6, 7])

    await subscriptions.subscribe.sendTransaction([1,2,3,4,5], { from: BOB })
    await subscriptions.unsubscribe.sendTransaction([2,4], { from: BOB })

    var  tradersBOB = (await subscriptions.getTraders(BOB)).map(trader => trader.toNumber())
    assert.deepEqual(tradersBOB, [1, 5, 3])

    await subscriptions.subscribe.sendTransaction([7], { from: BOB })

    var  tradersBOB = (await subscriptions.getTraders(BOB)).map(trader => trader.toNumber())
    assert.deepEqual(tradersBOB, [7])

    assert.deepEqual(await getInvestors(1), [])
    assert.deepEqual(await getInvestors(2), [])
    assert.deepEqual(await getInvestors(3), [])
    assert.deepEqual(await getInvestors(4), [])
    assert.deepEqual(await getInvestors(5), [])
    assert.deepEqual(await getInvestors(6, [ALICE]), [ALICE])
    assert.deepEqual(await getInvestors(7, [ALICE, BOB]), [ALICE, BOB])

    await subscriptions.unsubscribe.sendTransaction([7], { from: BOB })
    assert.deepEqual(await getInvestors(7, [ALICE, BOB]), [ALICE])

    const investorsWithPortfolios = await subscriptions.investorsWithPortfolios.call(BOB)
    assert.isFalse(investorsWithPortfolios)

    const investorLastPortfolioDate = (await subscriptions.getInvestorLastPortfolioDate(BOB)).toNumber()
    assert.isAbove(investorLastPortfolioDate, Date.now() / 1000)

    const investorLastPortfolioBlock = (await subscriptions.getInvestorLastPortfolioBlock(BOB)).toNumber()
    assert.equal(investorLastPortfolioBlock, 0)
  })

  it('`.setSubscriptionsLimit()` should works correctly', async () => {
    await subscriptions.setSubscriptionsLimit.sendTransaction(1, { from: ALICE })
    assert.equal(await subscriptions.SUBSCRIPTIONS_LIMIT.call(), 1)

    await subscriptions.setSubscriptionsLimit.sendTransaction(2, { from: ALICE })
    assert.equal(await subscriptions.SUBSCRIPTIONS_LIMIT.call(), 2)

    await subscriptions.setSubscriptionsLimit.sendTransaction(1, { from: ALICE })

    try {
      await subscriptions.subscribe.sendTransaction(TRADERS_IDS, { from: BOB })
      assert.fail('Investor cannot subscribe over `SUBSCRIPTIONS_LIMIT`!')
    } catch (error) {}

    const tradersBOB = await subscriptions.getTraders(BOB)
    assert.deepEqual(tradersBOB, [])
  })

})
