const debug = require('debug')('test:LiquidityProvider')

const Scrinium          = artifacts.require("Scrinium")
const Balances          = artifacts.require("Balances")
const Instruments       = artifacts.require("Instruments")
const Subscriptions     = artifacts.require("Subscriptions")
const Platform          = artifacts.require("Platform")
const LiquidityProvider = artifacts.require("LiquidityProvider")

contract('LiquidityProvider', function (accounts) {
  const ALICE = accounts[0]

  const ADDR_ZERO = '0x0000000000000000000000000000000000000000'
  const ADDR_ONE = '0x1111111111111111111111111111111111111111'

  const INITIAL_BALANCE = 6000000 * 10 ** 8

  // 2 ** 256 - 1
  const TRANSFER_ALLOWANCE = web3.toBigNumber('115792089237316195423570985008687907853269984665640564039457584007913129639935')

  let scrinium
  let balances
  let liquidityProvider

  before(async () => {
    scrinium          = await Scrinium.deployed()
    balances          = await Balances.deployed()
    liquidityProvider = await LiquidityProvider.deployed()

    await scrinium.mintToken(liquidityProvider.address, INITIAL_BALANCE)
  })

  it('platform address setting should works correctly', async () => {
    const _platform = await Platform.new(
      Balances.address,
      Instruments.address,
      Subscriptions.address,
      LiquidityProvider.address,
    )

    await liquidityProvider.setPlatformAddress(_platform.address, { from: ALICE })
    assert.equal(await liquidityProvider.platformAddress.call(), _platform.address)
  })

  it('should have correct balances transfer allowance after deploy', async () => {
    const allowance = await scrinium.allowance.call(LiquidityProvider.address, Balances.address)
    assert.equal(allowance.toString(), TRANSFER_ALLOWANCE.toString())
  })

  it('balances address setting with trasnfer approval should works correctly', async () => {
    const _balances = await Balances.new(Scrinium.address)

    await liquidityProvider.setBalancesAddress(_balances.address, { from: ALICE })
    assert.equal(await liquidityProvider.balancesAddress.call(), _balances.address)

    const oldAllowance = await scrinium.allowance.call(LiquidityProvider.address, balances.address)
    assert.equal(oldAllowance.toString(), (0).toString())

    const newAllowance = await scrinium.allowance.call(LiquidityProvider.address, _balances.address)
    assert.equal(newAllowance.toString(), TRANSFER_ALLOWANCE.toString())
  })

  it('should remove balances transfer allowance correctly', async () => {
    await liquidityProvider.removeBalancesTransferAllowance({ from: ALICE })

    const allowance = await scrinium.allowance.call(
      LiquidityProvider.address,
      await liquidityProvider.balancesAddress.call()
    )
    assert.equal(allowance.toString(), (0).toString())
  })

  it('should set commissions address correctly', async () => {
    try {
      await liquidityProvider.setCommissionsAddress(ADDR_ZERO)
    } catch (error) {}
    assert.notEqual(
      await liquidityProvider.commissionsAddress.call(),
      ADDR_ZERO,
    )

    await liquidityProvider.setCommissionsAddress(ADDR_ONE)
    assert.equal(
      await liquidityProvider.commissionsAddress.call(),
      ADDR_ONE,
    )
  })

  it('should withdraw pool balance correctly', async () => {
    const withdrawalAmount = web3.toBigNumber(1000 * 10 ** 8)
    const balanceBefore = await scrinium.balanceOf.call(liquidityProvider.address)

    debug('liquidityProdiver.balanceOf before %s', balanceBefore.toString())

    await liquidityProvider.withdrawPool(ADDR_ONE, withdrawalAmount)

    const addrOneBalance = await scrinium.balanceOf.call(ADDR_ONE)
    const balanceAfter1 = await scrinium.balanceOf.call(liquidityProvider.address)

    debug('ADDR_ONE.balanceOf after %s', addrOneBalance.toString())
    debug('liquidityProdiver.balanceOf after1 %s', balanceAfter1.toString())

    assert.equal(addrOneBalance.toString(), withdrawalAmount.toString())
    assert.equal(balanceAfter1.toString(), balanceBefore.sub(withdrawalAmount).toString())

    await liquidityProvider.withdrawPool(ADDR_ZERO, TRANSFER_ALLOWANCE)

    const ownerBalance = await scrinium.balanceOf.call(ALICE)
    const balanceAfter2 = await scrinium.balanceOf.call(liquidityProvider.address)

    debug('ALICE.balanceOf after %s', ownerBalance.toString())
    debug('liquidityProdiver.balanceOf after2 %s', balanceAfter2.toString())

    assert.equal(ownerBalance.toString(), balanceAfter1.toString())
    assert.equal(balanceAfter2.toString(), (0).toString())
  })
})
