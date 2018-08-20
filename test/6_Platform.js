const debug = require('debug')('test:Platform')

const Scrinium          = artifacts.require("Scrinium")
const Balances          = artifacts.require("Balances")
const Instruments       = artifacts.require("Instruments")
const Subscriptions     = artifacts.require("Subscriptions")
const LiquidityProvider = artifacts.require("LiquidityProvider")
const Platform          = artifacts.require("Platform")

const BALANCE_BEFORE = 100 * 10 ** 8

const COMMISSION_OPEN = 10 * 10 ** 8
const COMMISSION_CLOSE = COMMISSION_OPEN * 150 / 100
const COMMISSION_TOTAL = COMMISSION_OPEN + COMMISSION_CLOSE

const STATUS_OPENED = 2
const STATUS_CLOSED = 3

const INSTRUMENT = Object.freeze({
  ID     : 2,
  TYPE   : 1,
  SYMBOL : 'EURUSD',
})

contract('Platform', function (accounts) {
  // Owner
  const ALICE = accounts[0]
  // Investor
  const BOB = accounts[1]

  let scrinium
  let instruments
  let balances
  let subscriptions
  let liquidityProvider
  let platform

  let liquidityProviderInitialBalance = 0

  before(async () => {
    scrinium          = await Scrinium.deployed()
    instruments       = await Instruments.deployed()
    balances          = await Balances.deployed()
    subscriptions     = await Subscriptions.deployed()
    liquidityProvider = await LiquidityProvider.deployed()

    await scrinium.mintToken(liquidityProvider.address, 6000000 * 10 ** 8)

    liquidityProviderInitialBalance = await scrinium.balanceOf.call(liquidityProvider.address)
  })

  beforeEach(async () => {
    platform = await Platform.new(
      balances.address,
      instruments.address,
      subscriptions.address,
      liquidityProvider.address,
    )

    await balances.setPlatformAddress.sendTransaction(platform.address, { from: ALICE })
    await liquidityProvider.setPlatformAddress.sendTransaction(platform.address, { from: ALICE })
  })

  afterEach(async () => {
    const scriniumBalance = await scrinium.balanceOf(BOB)
    await scrinium.transfer(
      '0x0000000000000000000000000000000000000000',
      scriniumBalance,
      { from: BOB },
    )
  })

  const CMD_BUY = 0
  const CMD_SELL = 1

  const openTradeAssertions = [
    {tradeId: 1,  masterTradeId: 2,  cmd: CMD_BUY,  pips: 10,    balanceBefore: BALANCE_BEFORE, expectedProfit: 0.14 * 10 ** 8  },
    {tradeId: 3,  masterTradeId: 4,  cmd: CMD_BUY,  pips: -10,   balanceBefore: BALANCE_BEFORE, expectedProfit: -0.14 * 10 ** 8 },
    {tradeId: 5,  masterTradeId: 6,  cmd: CMD_BUY,  pips: -1000, balanceBefore: BALANCE_BEFORE, expectedProfit: -14 * 10 ** 8   },
    {tradeId: 7,  masterTradeId: 8,  cmd: CMD_BUY,  pips: 1,     balanceBefore: BALANCE_BEFORE, expectedProfit: 0.014 * 10 ** 8 },
    {tradeId: 9,  masterTradeId: 10, cmd: CMD_BUY,  pips: 0,     balanceBefore: BALANCE_BEFORE, expectedProfit: 0 * 10 ** 8     },
    {tradeId: 11, masterTradeId: 12, cmd: CMD_SELL, pips: 10,    balanceBefore: BALANCE_BEFORE, expectedProfit: -0.14 * 10 ** 8 },
    {tradeId: 13, masterTradeId: 14, cmd: CMD_SELL, pips: -100,  balanceBefore: BALANCE_BEFORE, expectedProfit: 1.4 * 10 ** 8   },
  ]

  let profits = web3.toBigNumber(0)

  openTradeAssertions.forEach(({ tradeId, masterTradeId, cmd, pips, balanceBefore, expectedProfit }, tradeIdx) => {
    it(`trade processing should works correctly for tradeId:${tradeId}`, async () => {
      await scrinium.mintToken.sendTransaction(BOB, balanceBefore, { from: ALICE })
      await scrinium.approve.sendTransaction(Balances.address, balanceBefore, { from: BOB })
      await balances.deposit.sendTransaction(balanceBefore, { from: BOB })

      const now = Date.now()

      const TRADE = {
        _tradeId: tradeId,
        _investor: BOB,
        _masterTradeId: masterTradeId,

        _instrumentId: INSTRUMENT.ID,
        _marginPercent: 28,
        _leverage: 500,
        _cmd: cmd,

        _openTime: now,
        _openPriceInstrument: parseInt(1.3 * 10 ** 6),
        _openPriceSCRBase: parseInt(5000000 / 1.4) + 1,

        _commission: COMMISSION_OPEN,

        _closeTime: now + 60 * 10 ** 3,
        _closePriceInstrument: parseInt(1.3 * 10 ** 6) + pips,
        _closePriceSCRBase: parseInt(5000000 / 1.4) + 1,
      }

      try {
        const txHash = await liquidityProvider.openTrade.sendTransaction(
          TRADE._tradeId,
          TRADE._investor,
          TRADE._masterTradeId,

          TRADE._instrumentId,
          TRADE._marginPercent,
          TRADE._leverage,
          TRADE._cmd,

          TRADE._openTime,
          TRADE._openPriceInstrument,
          TRADE._openPriceSCRBase,

          TRADE._commission,

          {
            from: ALICE
          }
        )
        const receipt = await web3.eth.getTransactionReceipt(txHash)

        debug('liquidityProvider.openTrade gasUsed %d', receipt.gasUsed)

      } catch (error) {
        console.error('openTrade', error)
        assert.fail()
      }

      const [
        liquidityProviderAddress,
        investor,
        masterTraderId,

        instrumentId,
        marginPercent,
        leverage,
        existingCmd,

        marginSCR,
        profitSCR,
        status
      ] = await platform.trades.call(tradeId)

      assert.equal(liquidityProviderAddress, liquidityProvider.address)
      assert.equal(investor, TRADE._investor)
      assert.equal(masterTraderId, TRADE._masterTradeId)
      assert.equal(instrumentId, TRADE._instrumentId)
      assert.equal(marginPercent.toNumber(), TRADE._marginPercent)
      assert.equal(leverage.toNumber(), TRADE._leverage)
      assert.equal(existingCmd, TRADE._cmd)

      assert.equal(marginSCR.toNumber(), 28 * 10 ** 8)
      assert.equal(profitSCR.toNumber(), 0)

      assert.equal(status, STATUS_OPENED)

      const [
        openTime, openPriceInstrument, openPriceSCRBaseCurrency,
        closeTime, closePriceInstrument, closePriceSCRBaseCurrency,
      ] = await platform.tradeQuotes.call(tradeId)

      assert.equal(openTime.toNumber(), TRADE._openTime)
      assert.equal(openPriceInstrument.toNumber(), TRADE._openPriceInstrument)
      assert.equal(openPriceSCRBaseCurrency, TRADE._openPriceSCRBase)

      assert.equal(closeTime.toNumber(), 0)
      assert.equal(closePriceInstrument.toNumber(), 0)
      assert.equal(closePriceSCRBaseCurrency.toNumber(), 0)

      assert.deepEqual(
        (await platform.getTradesIds()).map((item) => Number(item.toNumber())),
        [tradeId]
      )

      assert.equal(
        (await balances.balanceOf(TRADE._investor)).toNumber(),
        balanceBefore
      )

      /************************************************************************/

      try {
        const txHash = await liquidityProvider.closeTrade.sendTransaction(
          TRADE._tradeId,
          TRADE._closeTime,
          TRADE._closePriceInstrument,
          TRADE._closePriceSCRBase,

          COMMISSION_CLOSE,

          {
            from: ALICE
          }
        )
        const receipt = await web3.eth.getTransactionReceipt(txHash)

        debug('liquidityProvider.closeTrade gasUsed %d', receipt.gasUsed)

      } catch (error) {
        console.error('closeTrade', error)
        assert.fail()
      }

      let [
        ,
        ,
        ,

        ,
        ,
        ,
        ,

        ,
        _profitSCR,
        _status
      ] = await platform.trades.call(tradeId)

      profits = profits.add(_profitSCR)

      debug('TRADE._investor total profits %d', profits.div(10 ** 8).toNumber())

      assert.equal(_profitSCR.toNumber(), parseInt(expectedProfit))
      assert.equal(_status, STATUS_CLOSED, 'status should be closed')

      const balanceAfter = await balances.balanceOf(TRADE._investor)
      const expectedBalance = web3.toBigNumber(parseInt(balanceBefore + expectedProfit))
      const expectedBalanceWithoutCommission = expectedBalance.sub(COMMISSION_TOTAL)
      assert.equal(balanceAfter.toNumber(), expectedBalanceWithoutCommission.toNumber())

      const balancePlatform = await balances.balanceOf(TRADE._investor)
      await balances.withdrawal.sendTransaction(balancePlatform, { from: TRADE._investor })
      const balanceScrinium = await scrinium.balanceOf(TRADE._investor)
      assert.equal(balanceScrinium.toNumber(), balancePlatform.toNumber())

      const balanceCommissions = await scrinium.balanceOf(await liquidityProvider.commissionsAddress.call())
      assert.equal(balanceCommissions.toNumber(), COMMISSION_TOTAL * (tradeIdx + 1))

      const liquidityProviderBalance = await scrinium.balanceOf.call(liquidityProvider.address)
      const expectedLiquidityProdiverBalance = liquidityProviderInitialBalance.add(profits.mul(-1))
      assert.equal(liquidityProviderBalance.toNumber(), expectedLiquidityProdiverBalance.toNumber())
    })
  })
})
