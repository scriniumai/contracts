const debug = require('debug')('test:Platform')

const Scrinium          = artifacts.require("Scrinium")
const Balances          = artifacts.require("Balances")
const Instruments       = artifacts.require("Instruments")
const Subscriptions     = artifacts.require("Subscriptions")
const LiquidityProvider = artifacts.require("LiquidityProvider")
const Platform          = artifacts.require("Platform")

const BALANCE_BEFORE = 100 * 10 ** 8

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
  let liquidityProdiver
  let platform

  before(async () => {
    scrinium          = await Scrinium.deployed()
    instruments       = await Instruments.deployed()
    balances          = await Balances.deployed()
    subscriptions     = await Subscriptions.deployed()
    liquidityProdiver = await LiquidityProvider.deployed()

    await scrinium.mintToken.sendTransaction(BOB, BALANCE_BEFORE)
  })

  beforeEach(async () => {
    platform = await Platform.new(
      balances.address,
      instruments.address,
      subscriptions.address,
      liquidityProdiver.address,
    )

    await balances.setPlatformAddress.sendTransaction(platform.address, { from: ALICE })
    await liquidityProdiver.setPlatformAddress.sendTransaction(platform.address, { from: ALICE })
  })

  afterEach(async () => {
    const scriniumBalance = await scrinium.balanceOf(BOB)
    await scrinium.transfer('0x0000000000000000000000000000000000000000', scriniumBalance)
  })

  const CMD_BUY = 0
  const CMD_SELL = 1

  var openTradeAssertions = [
    {tradeId: 1,  masterTradeId: 2,  cmd: CMD_BUY,  pips: 10,    balanceBefore: BALANCE_BEFORE, expectedProfit: 0.14 * 10 ** 8  },
    {tradeId: 3,  masterTradeId: 4,  cmd: CMD_BUY,  pips: -10,   balanceBefore: BALANCE_BEFORE, expectedProfit: -0.14 * 10 ** 8 },
    {tradeId: 5,  masterTradeId: 6,  cmd: CMD_BUY,  pips: -1000, balanceBefore: BALANCE_BEFORE, expectedProfit: -14 * 10 ** 8   },
    {tradeId: 7,  masterTradeId: 8,  cmd: CMD_BUY,  pips: 1,     balanceBefore: BALANCE_BEFORE, expectedProfit: 0.014 * 10 ** 8 },
    {tradeId: 9,  masterTradeId: 10, cmd: CMD_BUY,  pips: 0,     balanceBefore: BALANCE_BEFORE, expectedProfit: 0 * 10 ** 8     },
    {tradeId: 11, masterTradeId: 12, cmd: CMD_SELL, pips: 10,    balanceBefore: BALANCE_BEFORE, expectedProfit: -0.14 * 10 ** 8 },
    {tradeId: 13, masterTradeId: 14, cmd: CMD_SELL, pips: -100,  balanceBefore: BALANCE_BEFORE, expectedProfit: 1.4 * 10 ** 8   },
  ]

  openTradeAssertions.forEach(({ tradeId, masterTradeId, cmd, pips, balanceBefore, expectedProfit }) => {
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

        _commission: 0,

        _closeTime: now + 60 * 10 ** 3,
        _closePriceInstrument: parseInt(1.3 * 10 ** 6) + pips,
        _closePriceSCRBase: parseInt(5000000 / 1.4) + 1,
      }

      try {
        await liquidityProdiver.openTrade.sendTransaction(
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
      } catch (error) {
        console.error('openTrade', error)
        assert.fail()
      }

      const [
        liquidityProdiverAddress,
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

      assert.equal(liquidityProdiverAddress, liquidityProdiver.address)
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
        await liquidityProdiver.closeTrade.sendTransaction(
          TRADE._tradeId,
          TRADE._closeTime,
          TRADE._closePriceInstrument,
          TRADE._closePriceSCRBase,

          0,

          {
            from: ALICE
          }
        )
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

      assert.equal(_profitSCR.toNumber(), parseInt(expectedProfit))
      assert.equal(_status, STATUS_CLOSED, 'status should be closed')

      const balanceAfter = await balances.balanceOf(TRADE._investor)
      assert.equal(balanceAfter.toNumber(), parseInt(balanceBefore + expectedProfit))

      // TODO: Add assertion for withdrawal operation
      const balance = await balances.balanceOf(TRADE._investor)
      await balances.withdrawal.sendTransaction(balance, { from: BOB })
      // TODO: Add assertion for LiquidityProvider commission
      // TODO: Add assertion for LiquidityProvider balance
    })
  })
})
