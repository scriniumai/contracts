const debug = require('debug')('test:Platform')

const { soliditySha3 } = require('web3-utils')

const { toBigNumber } = web3

const Scrinium          = artifacts.require("Scrinium")
const Balances          = artifacts.require("Balances")
const Instruments       = artifacts.require("Instruments")
const Subscriptions     = artifacts.require("Subscriptions")
const LiquidityProvider = artifacts.require("LiquidityProvider")
const Platform          = artifacts.require("Platform")

const DEFAULT_MULTIPLIER = 10 ** 18
const PRICE_MULTIPLIER = 10 ** 6
const SCR_MULTIPLIER = 10 ** 8

const BALANCE_BEFORE = 100 * SCR_MULTIPLIER

const COMMISSION_OPEN = 10 * SCR_MULTIPLIER
const COMMISSION_CLOSE = COMMISSION_OPEN * 1.1
const COMMISSION_TOTAL = COMMISSION_OPEN + COMMISSION_CLOSE

const STATUS_OPENED = 2
const STATUS_CLOSED = 3
const STATUS_CLOSED_FORCE = 4

const INSTRUMENT = Object.freeze({
  ID     : 2,
  TYPE   : 1,
  SYMBOL : 'EURUSD',
})

const CONVERSION_COEFFICIENT = 0.75 * DEFAULT_MULTIPLIER

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

    await scrinium.mintToken(liquidityProvider.address, 6000000 * SCR_MULTIPLIER)

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

  const tradesAssertions = [
    {tradeId: 1,  masterTradeId: 2,  cmd: CMD_BUY,  pips: 10,    balanceBefore: BALANCE_BEFORE, expectedProfit: 0.14  * SCR_MULTIPLIER * CONVERSION_COEFFICIENT },
    {tradeId: 3,  masterTradeId: 4,  cmd: CMD_BUY,  pips: -10,   balanceBefore: BALANCE_BEFORE, expectedProfit: -0.14 * SCR_MULTIPLIER * CONVERSION_COEFFICIENT },
    {tradeId: 5,  masterTradeId: 6,  cmd: CMD_BUY,  pips: -1000, balanceBefore: BALANCE_BEFORE, expectedProfit: -14   * SCR_MULTIPLIER * CONVERSION_COEFFICIENT },
    {tradeId: 7,  masterTradeId: 8,  cmd: CMD_BUY,  pips: 1,     balanceBefore: BALANCE_BEFORE, expectedProfit: 0.014 * SCR_MULTIPLIER * CONVERSION_COEFFICIENT },
    {tradeId: 9,  masterTradeId: 10, cmd: CMD_BUY,  pips: 0,     balanceBefore: BALANCE_BEFORE, expectedProfit: 0     * SCR_MULTIPLIER * CONVERSION_COEFFICIENT },
    {tradeId: 11, masterTradeId: 12, cmd: CMD_SELL, pips: 10,    balanceBefore: BALANCE_BEFORE, expectedProfit: -0.14 * SCR_MULTIPLIER * CONVERSION_COEFFICIENT },

    {tradeId: 13, masterTradeId: 14, cmd: CMD_SELL, pips: -100,  balanceBefore: BALANCE_BEFORE, expectedProfit: 1.4   * SCR_MULTIPLIER * CONVERSION_COEFFICIENT  },

    // Force closing
    {tradeId: 15, masterTradeId: 16, cmd: CMD_SELL, pips: -100,  balanceBefore: BALANCE_BEFORE, expectedProfit: 0, useForceClosing: true },

    // TODO: Add tests for balance zerofication case
  ]

  let profits = toBigNumber(0)

  tradesAssertions.forEach(({ tradeId, masterTradeId, cmd, pips, balanceBefore, expectedProfit, useForceClosing }, tradeIdx) => {
    it(`trade processing should works correctly for tradeId:${tradeId}`, async () => {
      await scrinium.mintToken.sendTransaction(BOB, balanceBefore, { from: ALICE })
      await scrinium.approve.sendTransaction(Balances.address, balanceBefore, { from: BOB })
      await balances.deposit.sendTransaction(Date.now(), balanceBefore, { from: BOB })

      const now = Date.now()

      const TRADE = {
        _tradeId: tradeId,
        _investor: BOB,
        _masterTraderId: masterTradeId,

        _instrumentId: INSTRUMENT.ID,
        _marginPercent: 28,
        _leverage: 500,
        _cmd: cmd,

        _openTime: now,
        _openPriceInstrument: 1.3 * PRICE_MULTIPLIER,
        _openPriceSCRBase: 0,

        _closeTime: now + 60 * 10 ** 3,
        _closePriceInstrument: (1.3 * PRICE_MULTIPLIER) + pips,
        _closePriceSCRBase: 0,

        _marginRegulator: DEFAULT_MULTIPLIER,
      }

      try {
        const txHash = await liquidityProvider.openTrade.sendTransaction(
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
        const receipt = await web3.eth.getTransactionReceipt(txHash)

        debug('liquidityProvider.openTrade() gasUsed %d', receipt.gasUsed)

      } catch (error) {
        console.error('openTrade', error)
        assert.fail()
      }

      if (useForceClosing) {
        const txHash = await platform.closeTradeForce.sendTransaction(
          TRADE._tradeId,

          {
            from: ALICE
          }
        )
        const receipt = await web3.eth.getTransactionReceipt(txHash)

        debug('platform.closeTradeForce() gasUsed %d', receipt.gasUsed)

        const [
          ,
          ,
          ,

          ,
          ,
          ,
          ,

          ,
          ,
          ,

          status
        ] = await platform.trades.call(TRADE._tradeId)

        assert.equal(status.toNumber(), STATUS_CLOSED_FORCE)

        return
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
        marginRegulator,
        profitSCR,

        status
      ] = await platform.getTrade.call(TRADE._tradeId)

      assert.equal(liquidityProviderAddress, liquidityProvider.address)
      assert.equal(investor, TRADE._investor)
      assert.equal(masterTraderId, TRADE._masterTraderId)
      assert.equal(instrumentId, TRADE._instrumentId)
      assert.equal(marginPercent.toNumber(), TRADE._marginPercent)
      assert.equal(leverage.toNumber(), TRADE._leverage)
      assert.equal(existingCmd, TRADE._cmd)

      assert.equal(marginSCR.toNumber(), 28 * SCR_MULTIPLIER)
      assert.equal(marginRegulator.toNumber(), 0)
      assert.equal(profitSCR.toNumber(), 0)

      assert.equal(status.toNumber(), STATUS_OPENED)

      const [
        openTime, openPriceInstrument, openPriceSCRBaseCurrency,
        closeTime, closePriceInstrument, closePriceSCRBaseCurrency,
      ] = await platform.tradeQuotes.call(TRADE._tradeId)

      assert.equal(openTime.toNumber(), TRADE._openTime)
      assert.equal(openPriceInstrument.toNumber(), TRADE._openPriceInstrument)
      assert.equal(openPriceSCRBaseCurrency, TRADE._openPriceSCRBase)

      assert.equal(closeTime.toNumber(), 0)
      assert.equal(closePriceInstrument.toNumber(), 0)
      assert.equal(closePriceSCRBaseCurrency.toNumber(), 0)

      assert.isTrue(
        (await platform.getTradesIds())
          .map(item => item.toNumber())
          .includes(TRADE._tradeId),
      )

      assert.equal(
        (await balances.balanceOf(TRADE._investor)).toNumber(),
        balanceBefore
      )

      assert.isTrue(
        (await platform.getInvestorTrades(TRADE._investor))
          .map(item => item.toNumber())
          .includes(TRADE._tradeId),
      )

      /************************************************************************/

      try {
        const txHash = await liquidityProvider.closeTrade.sendTransaction(
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
        const receipt = await web3.eth.getTransactionReceipt(txHash)

        debug('liquidityProvider.closeTrade() gasUsed %d', receipt.gasUsed)

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
        ,
        _profitSCR,

        _status
      ] = await platform.getTrade.call(tradeId)

      const expectedProfitWithCoeff = toBigNumber(expectedProfit).div(DEFAULT_MULTIPLIER)

      assert.equal(_profitSCR.toNumber(), expectedProfitWithCoeff.truncated())
      assert.equal(_status, STATUS_CLOSED, 'status should be closed')

      profits = profits.add(_profitSCR)

      debug('TRADE._investor total profits %d', profits.div(SCR_MULTIPLIER).toNumber())

      const balanceAfter = await balances.balanceOf(TRADE._investor)
      const expectedBalance = toBigNumber(balanceBefore).add(expectedProfitWithCoeff)
      const expectedBalanceWithoutCommission = expectedBalance.sub(COMMISSION_TOTAL)
      assert.equal(balanceAfter.toNumber(), expectedBalanceWithoutCommission.toNumber())

      const balancePlatform = await balances.balanceOf(TRADE._investor)
      const withdrawalExternalId = Date.now()
      const _msgSig = web3.eth.sign(ALICE, soliditySha3(
        TRADE._investor,
        withdrawalExternalId,
        balancePlatform,
        Balances.address,
      ))
      await balances.withdrawal.sendTransaction(
        withdrawalExternalId,
        balancePlatform,
        _msgSig,
        { from: TRADE._investor }
      )

      const balanceScrinium = await scrinium.balanceOf(TRADE._investor)
      assert.equal(balanceScrinium.toNumber(), balancePlatform.toNumber())

      const balanceCommissions = await scrinium.balanceOf(await liquidityProvider.commissionsAddress.call())
      assert.equal(balanceCommissions.toNumber(), COMMISSION_TOTAL * (tradeIdx + 1))

      const liquidityProviderBalance = await scrinium.balanceOf.call(liquidityProvider.address)
      const expectedLiquidityProdiverBalance = liquidityProviderInitialBalance.add(profits.mul(-1))
      assert.equal(liquidityProviderBalance.toNumber(), expectedLiquidityProdiverBalance.toNumber())
    })
  })

  it('`.closeTrades()` should works correctly', async () => {
    const now = Date.now()

    await scrinium.mintToken.sendTransaction(EVE, BALANCE_BEFORE, { from: ALICE })
    await scrinium.approve.sendTransaction(Balances.address, BALANCE_BEFORE, { from: EVE })
    await balances.deposit.sendTransaction(now, BALANCE_BEFORE, { from: EVE })

    await subscriptions.subscribe.sendTransaction([98, 100], { from: EVE })

    const tradesAssertionsCommon = {
      _instrumentId: INSTRUMENT.ID,
      _marginPercent: 28,
      _leverage: 500,

      _openTime: now,
      _openPriceInstrument: 1.3 * PRICE_MULTIPLIER,
      _openPriceSCRBase: 0,

      _closeTime: now + 60 * 10 ** 3,
      _closePriceInstrument: (1.3 * PRICE_MULTIPLIER) + 1000,
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

    const actualTradesIds = (await platform.getInvestorActualTrades(EVE)).map(tradeId => tradeId.toNumber())
    assert.deepEqual(actualTradesIds, tradesAssertions.map(({ _tradeId }) => _tradeId))

    const txParams = actualTradesIds.reduce((params, tradeId) => {
      const trade = tradesAssertions.find(({ _tradeId }) => _tradeId === tradeId)

      return {
        _tradesIds: [...params._tradesIds, tradeId],
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

    const txHash = await liquidityProvider.closeTrades.sendTransaction(
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
    const receipt = await web3.eth.getTransactionReceipt(txHash)

    debug('liquidityProvider.closeTrades() gasUsed %d', receipt.gasUsed)

    const balancePlatform = (await balances.balanceOf(EVE)).toNumber()
    assert.equal(balancePlatform, BALANCE_BEFORE - COMMISSION_TOTAL * tradesAssertions.length)
  })
})
