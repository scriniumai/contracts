const debug = require('debug')('test:Balances')

const Scrinium = artifacts.require("Scrinium")
const Balances = artifacts.require("Balances")
const Platform = artifacts.require("Platform")

contract('Balances', function(accounts) {
  const ALICE = accounts[0]
  const BOB = accounts[1]

  let balances, scrinium, platform

  before(async () => {
    scrinium = await Scrinium.deployed()
    await scrinium.mintToken.sendTransaction(ALICE, 1000) //ALICE has 1000 SCR

    balances = await Balances.deployed()

    platform = await Platform.deployed()
  })

  it("balanceOf should returns 0 SCR for new accounts", async () => {
    const balance = await balances.balanceOf(ALICE)
    assert.equal(balance.toNumber(), 0, "0 SCR should be on first account after deploing contract")
  })

  it("deposit should works correctly: 100SCR from ALICE", async () => {
    // 1. Alice allows to use 100 SCR for Balances
    await scrinium.approve.sendTransaction(Balances.address, 100, {from: ALICE})

    // 2. Alice deposits 100 SRC to contract
    await balances.deposit.sendTransaction(Date.now(), 100, {from: ALICE})

    // Assertions:
    const balanceOfAliceOnPlatform = await balances.balanceOf(ALICE)
    const balanceOfAliceOnScrinium = await scrinium.balanceOf(ALICE)
    const balanceOfContractOnScrinium = await scrinium.balanceOf(Balances.address)

    assert.equal(balanceOfAliceOnPlatform, 100, "ALICE should receive 100 SCR on Balances")
    assert.equal(balanceOfAliceOnScrinium, 900, "ALICE should keep 1000-100 SCR")
    assert.equal(balanceOfContractOnScrinium, 100, "contract Balances should receive 100 SCR from ALICE")

    // tearDown - withdrawal all deposited SCR
    await balances.withdrawal.sendTransaction(Date.now(), 100, {from: ALICE})
  })

  it("withdrawal should works correctly: 30SCR to ALICE", async () => {
    // 1. Alice approve and deposit 100 SCR to Balances
    await scrinium.approve.sendTransaction(Balances.address, 100, {from: ALICE})
    await balances.deposit.sendTransaction(Date.now(), 100, {from: ALICE})

    // 2. Alice withdrawal 30 SCR
    await balances.withdrawal.sendTransaction(Date.now(), 30, {from: ALICE})

    // Assertions:
    const balanceOfAliceOnPlatform = await balances.balanceOf(ALICE)
    const balanceOfAliceOnScrinium = await scrinium.balanceOf(ALICE)
    const balanceOfContractOnScrinium = await scrinium.balanceOf(Balances.address)

    assert.equal(balanceOfAliceOnPlatform, 100-30, "ALICE should view 70SCR on balances")

    assert.equal(balanceOfAliceOnScrinium, 1000-100+30, "ALICE should view 930 SRC on Scrinium")
    assert.equal(balanceOfContractOnScrinium, 100-30, "contract Balances should keep 70SCR on ALICE's address")

    // tearDown - withdrawal all deposited SCR
    await balances.withdrawal.sendTransaction(Date.now(), 70, {from: ALICE})
  })

  it("withdrawal not works for amount greater than balance", async () => {
    await scrinium.approve.sendTransaction(Balances.address, 100, {from: ALICE})
    await balances.deposit.sendTransaction(Date.now(), 100, {from: ALICE})

    // Alice trying to withdrawal 101 * -10^8 SRC
    try {
      await balances.withdrawal.sendTransaction(Date.now(), 101, {from: ALICE})
      assert.fail('Withdrawal should not pass')
    } catch (err) {}

    const balanceAfter = await balances.balanceOf(ALICE)
    assert.equal(balanceAfter, 100, "Alice's balance should be equal 70 SCR")

    // tearDown
    await balances.withdrawal.sendTransaction(Date.now(), 100, {from: ALICE})
  })

  it("setPlatform should change allowed platform address", async () => {
    await balances.setPlatformAddress.sendTransaction(platform.address, {from: ALICE})

    assert.equal(
      await balances.platformAddress.call(),
      platform.address,
      "Alice change platformAddress"
    )
  })

  it("setPlatform works for owners only", async () => {
    const fakeAddress = "0x0000000000000000000000000000000000000003"

    try {
      await balances.setPlatformAddress.sendTransaction(fakeAddress, {from: BOB}) //BOB want to change platformAddress
      assert.fail('Bob cannot change platformAddress')
    } catch (err) {}

    assert.notEqual(
      await balances.platformAddress.call(),
      fakeAddress,
      "Bob cannot change platformAddress"
    )
  })

})
