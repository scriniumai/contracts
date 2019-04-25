const debug = require('debug')('test:Platform')

const BigNumber = require('bignumber.js')

const Scrinium          = artifacts.require("Scrinium")
const Balances          = artifacts.require("Balances")
const Instruments       = artifacts.require("Instruments")
const Subscriptions     = artifacts.require("Subscriptions")
const LiquidityProvider = artifacts.require("LiquidityProvider")
const Platform          = artifacts.require("Platform")

const { soliditySha3 } = web3.utils


const DEFAULT_MULTIPLIER = new BigNumber(10 ** 18)
const PRICE_MULTIPLIER = new BigNumber(10 ** 6)
const SCR_MULTIPLIER = new BigNumber(10 ** 8)

const BALANCE_BEFORE = SCR_MULTIPLIER.times(100)

const COMMISSION_OPEN = SCR_MULTIPLIER.times(10)
const COMMISSION_CLOSE = COMMISSION_OPEN.times(1.1)
const COMMISSION_TOTAL = COMMISSION_OPEN.plus(COMMISSION_CLOSE)

const STATUS_OPENED = 2
const STATUS_CLOSED = 3
const STATUS_CLOSED_FORCE = 4

const INSTRUMENT = Object.freeze({
  ID     : 2,
  TYPE   : 1,
  SYMBOL : 'EURUSD',
})

const CONVERSION_COEFFICIENT = DEFAULT_MULTIPLIER.times(0.75)

contract('Platform', function (accounts) {
  // Owner
  const ALICE = accounts[0]
  // Investor 1
  const BOB = accounts[1]
  // Investor 2
  const EVE = accounts[2]

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

    await scrinium.mintToken(liquidityProvider.address, SCR_MULTIPLIER.times(6000000).toNumber())

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

  // TODO: Add tests for balance zerofication case
  // TODO: Add tests for unsubscribe and closing all trades

  const tradesAssertions = [
    {tradeId:  1, masterTradeId:  2, cmd: CMD_BUY,  pips:    10, expectedProfit:   0.14  },
    {tradeId:  3, masterTradeId:  4, cmd: CMD_BUY,  pips:   -10, expectedProfit:  -0.14  },
    {tradeId:  5, masterTradeId:  6, cmd: CMD_BUY,  pips: -1000, expectedProfit: -14     },
    {tradeId:  7, masterTradeId:  8, cmd: CMD_BUY,  pips:     1, expectedProfit:   0.014 },
    {tradeId:  9, masterTradeId: 10, cmd: CMD_BUY,  pips:     0, expectedProfit:   0     },
    {tradeId: 11, masterTradeId: 12, cmd: CMD_SELL, pips:    10, expectedProfit:  -0.14  },
    {tradeId: 13, masterTradeId: 14, cmd: CMD_SELL, pips:  -100, expectedProfit:   1.4    },
    {tradeId: 15, masterTradeId: 16, cmd: CMD_SELL, pips:  -100, expectedProfit:   0, useForceClosing: true  },
  ].map(_ => ({
    ..._,

    balanceBefore: BALANCE_BEFORE,

    expectedProfit: new BigNumber(_.expectedProfit).times(SCR_MULTIPLIER).times(CONVERSION_COEFFICIENT),
  }))

  let profits = new BigNumber(0)

  tradesAssertions.forEach(({ tradeId, masterTradeId, cmd, pips, balanceBefore, expectedProfit, useForceClosing }, tradeIdx) => {
    it('`.openTrade()`, `.closeTrade()` and `.closeTradeForce()` should works correctly for trade: ' + tradeId, async () => {

      const now = new BigNumber(Date.now())

      await scrinium.mintToken.sendTransaction(BOB, balanceBefore, { from: ALICE })
      await scrinium.approve.sendTransaction(Balances.address, balanceBefore, { from: BOB })
      await balances.deposit.sendTransaction(now, balanceBefore, { from: BOB })

      const TRADE = {
        _tradeId: tradeId,
        _investor: BOB,
        _masterTraderId: masterTradeId,

        _instrumentId: INSTRUMENT.ID,
        _marginPercent: 28,
        _leverage: 500,
        _cmd: cmd,

        _openTime: now,
        _openPriceInstrument: PRICE_MULTIPLIER.times(1.3),
        _openPriceSCRBase: 0,

        _closeTime: now.plus(60 * 10 ** 3),
        _closePriceInstrument: PRICE_MULTIPLIER.times(1.3).plus(pips),
        _closePriceSCRBase: 0,

        _marginRegulator: DEFAULT_MULTIPLIER,
      }

      try {
        const tx = await liquidityProvider.openTrade.sendTransaction(
          TRADE._tradeId,
          TRADE._investor,
          TRADE._masterTraderId,

          TRADE._instrumentId,
          TRADE._marginPercent,
          TRADE._leverage,
          TRADE._cmd,

          TRADE._openTime,
          TRADE._openPriceInstrument,
          TRADE._openPriceSCRBase,

          COMMISSION_OPEN,

          {
            from: ALICE
          }
        )

        debug('liquidityProvider.openTrade() gasUsed %d', tx.receipt.gasUsed)

      } catch (error) {
        console.error('openTrade', error)
        assert.fail()
      }

      if (useForceClosing) {
        const tx = await platform.closeTradeForce.sendTransaction(
          TRADE._tradeId,

          {
            from: ALICE
          }
        )

        debug('platform.closeTradeForce() gasUsed %d', tx.receipt.gasUsed)

        var {
          _status
         } = await platform.getTrade.call(TRADE._tradeId)

        assert.equal(_status, STATUS_CLOSED_FORCE)

        return
      }

      var {
        _liquidityProviderAddress,
        _investor,
        _masterTraderId,

        _instrumentId,
        _marginPercent,
        _leverage,
        _cmd,

        _marginSCR,
        _marginRegulator,
        _profitSCR,

        _status,
      } = await platform.getTrade.call(TRADE._tradeId)

      assert.equal(_liquidityProviderAddress, liquidityProvider.address)
      assert.equal(_investor, TRADE._investor)
      assert.equal(_masterTraderId, TRADE._masterTraderId)
      assert.equal(_instrumentId, TRADE._instrumentId)
      assert.equal(_marginPercent, TRADE._marginPercent)
      assert.equal(_leverage, TRADE._leverage)
      assert.equal(_cmd, TRADE._cmd)

      assert.equal(_marginSCR.toNumber(), SCR_MULTIPLIER.times(28).toNumber())
      assert.equal(_marginRegulator, 0)
      assert.equal(_profitSCR, 0)

      assert.equal(_status, STATUS_OPENED)

      const {
        _openTime,
        _openPriceInstrument,
        _openPriceSCRBaseCurrency,
        _closeTime,
        _closePriceInstrument,
        _closePriceSCRBaseCurrency,
       } = await platform.getTradeQuote.call(TRADE._tradeId)

      assert.equal(_openTime.toNumber(), TRADE._openTime.toNumber())
      assert.equal(_openPriceInstrument.toNumber(), TRADE._openPriceInstrument.toNumber())
      assert.equal(_openPriceSCRBaseCurrency, TRADE._openPriceSCRBase)

      assert.equal(_closeTime, 0)
      assert.equal(_closePriceInstrument, 0)
      assert.equal(_closePriceSCRBaseCurrency, 0)

      assert.isTrue(
        (await platform.getTradesIds())
          .map(tradeId => tradeId.toNumber())
          .includes(TRADE._tradeId),
      )

      assert.equal(
        (await balances.balanceOf(TRADE._investor)).toNumber(),
        balanceBefore,
      )

      assert.isTrue(
        (await platform.getInvestorTrades(TRADE._investor))
          .map(tradeId => tradeId.toNumber())
          .includes(TRADE._tradeId),
      )

      /************************************************************************/

      try {
        const tx = await liquidityProvider.closeTrade.sendTransaction(
          TRADE._tradeId,
          TRADE._marginRegulator,

          TRADE._closeTime,
          TRADE._closePriceInstrument,
          TRADE._closePriceSCRBase,

          COMMISSION_CLOSE,

          CONVERSION_COEFFICIENT,

          {
            from: ALICE
          }
        )

        debug('liquidityProvider.closeTrade() gasUsed %d', tx.receipt.gasUsed)

      } catch (error) {
        console.error('closeTrade', error)
        assert.fail()
      }

      var {
        _profitSCR,
        _status,
      } = await platform.getTrade.call(tradeId)

      const expectedProfitWithCoeff = expectedProfit.div(DEFAULT_MULTIPLIER)

      assert.equal(_profitSCR.toNumber(), expectedProfitWithCoeff.toNumber())
      assert.equal(_status, STATUS_CLOSED, 'status should be closed')

      profits = profits.plus(_profitSCR)

      debug('TRADE._investor total profits %d', profits.div(SCR_MULTIPLIER).toNumber())

      const balanceAfter = await balances.balanceOf(TRADE._investor)
      const expectedBalance = balanceBefore.plus(expectedProfitWithCoeff)
      const expectedBalanceWithoutCommission = expectedBalance.minus(COMMISSION_TOTAL)
      assert.equal(balanceAfter.toNumber(), expectedBalanceWithoutCommission.toNumber())

      const balancePlatform = await balances.balanceOf(TRADE._investor)
      const withdrawalExternalId = Date.now()
      const _msgSig = await web3.eth.sign(soliditySha3(
        TRADE._investor,
        withdrawalExternalId,
        balancePlatform,
        Balances.address,
      ), ALICE)
      await balances.withdrawal.sendTransaction(
        withdrawalExternalId,
        balancePlatform,
        _msgSig,
        { from: TRADE._investor }
      )

      const balanceScrinium = await scrinium.balanceOf(TRADE._investor)
      assert.equal(balanceScrinium.toNumber(), balancePlatform.toNumber())

      const balanceCommissions = await scrinium.balanceOf(await liquidityProvider.commissionsAddress.call())
      assert.equal(balanceCommissions.toNumber(), COMMISSION_TOTAL.times(tradeIdx + 1).toNumber())

      const liquidityProviderBalance = await scrinium.balanceOf.call(liquidityProvider.address)
      const expectedLiquidityProdiverBalance = new BigNumber(liquidityProviderInitialBalance.toNumber()).plus(profits.times(-1))
      assert.equal(liquidityProviderBalance.toNumber(), expectedLiquidityProdiverBalance.toNumber())
    })
  })

  it('`.closeTrades()` [without unsubscribing] should works correctly', async () => {

    const now = new BigNumber(Date.now())

    await scrinium.mintToken.sendTransaction(EVE, BALANCE_BEFORE, { from: ALICE })
    await scrinium.approve.sendTransaction(Balances.address, BALANCE_BEFORE, { from: EVE })
    await balances.deposit.sendTransaction(now, BALANCE_BEFORE, { from: EVE })

    await subscriptions.subscribe.sendTransaction([98, 100], { from: EVE })

    const tradesAssertionsCommon = {
      _instrumentId: INSTRUMENT.ID,
      _marginPercent: 28,
      _leverage: 500,

      _openTime: now,
      _openPriceInstrument: PRICE_MULTIPLIER.times(1.3),
      _openPriceSCRBase: 0,

      _closeTime: now.plus(60 * 10 ** 3),
      _closePriceInstrument: PRICE_MULTIPLIER.times(1.3).plus(1000),
      _closePriceSCRBase: 0,

      _marginRegulator: DEFAULT_MULTIPLIER,
    }
    const tradesAssertions = [
      {
        ...tradesAssertionsCommon,

        _tradeId: 99,
        _investor: EVE,
        _masterTraderId: 98,
        _cmd: CMD_BUY,
      },
      {
        ...tradesAssertionsCommon,

        _tradeId: 101,
        _investor: EVE,
        _masterTraderId: 100,
        _cmd: CMD_SELL,
      },
      {
        ...tradesAssertionsCommon,

        _tradeId: 103,
        _investor: EVE,
        _masterTraderId: 98,
        _cmd: CMD_BUY,
      },
      {
        ...tradesAssertionsCommon,

        _tradeId: 105,
        _investor: EVE,
        _masterTraderId: 100,
        _cmd: CMD_SELL,
      },
    ]

    for (const trade of tradesAssertions) {
      await liquidityProvider.openTrade.sendTransaction(
        trade._tradeId,
        trade._investor,
        trade._masterTraderId,

        trade._instrumentId,
        trade._marginPercent,
        trade._leverage,
        trade._cmd,

        trade._openTime,
        trade._openPriceInstrument,
        trade._openPriceSCRBase,

        COMMISSION_OPEN,

        {
          from: ALICE
        }
      )
    }

    const actualTradesIds = await platform.getInvestorActualTrades(EVE)
    assert.deepEqual(actualTradesIds.map(tradeId => tradeId.toNumber()), tradesAssertions.map(({ _tradeId }) => _tradeId))

    const txParams = actualTradesIds.reduce((params, tradeId) => {
      const trade = tradesAssertions.find(({ _tradeId }) => _tradeId === tradeId.toNumber())

      return {
        _tradesIds: [...params._tradesIds, tradeId.toNumber()],
        _marginRegulators: [...params._marginRegulators, trade._marginRegulator],

        _closeTime: tradesAssertionsCommon._closeTime,
        _closePriceInstruments: [...params._closePriceInstruments, trade._closePriceInstrument],
        _closePriceSCRBases: [...params._closePriceSCRBases, trade._openPriceSCRBase],

        _commissions: [...params._commissions, COMMISSION_CLOSE],

        _conversionCoefficients: [ ...params._conversionCoefficients, CONVERSION_COEFFICIENT ]
      }
    }, {
      _tradesIds: [],
      _marginRegulators: [],

      _closeTime: 0,
      _closePriceInstruments: [],
      _closePriceSCRBases: [],

      _commissions: [],

      _conversionCoefficients: []
    })

    const tx = await liquidityProvider.closeTrades.sendTransaction(
      txParams._tradesIds,
      txParams._marginRegulators,

      txParams._closeTime,
      txParams._closePriceInstruments,
      txParams._closePriceSCRBases,

      txParams._commissions,

      txParams._conversionCoefficients,

      {
        from: ALICE
      }
    )

    debug('liquidityProvider.closeTrades() gasUsed %d', tx.receipt.gasUsed)

    const balancePlatform = await balances.balanceOf(EVE)
    assert.equal(balancePlatform.toNumber(), BALANCE_BEFORE.minus((COMMISSION_TOTAL).times(tradesAssertions.length)).toNumber())
  })
})
