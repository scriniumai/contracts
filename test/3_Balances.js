const debug = require('debug')('test:Balances')

const Scrinium = artifacts.require("Scrinium")
const Balances = artifacts.require("Balances")
const Platform = artifacts.require("Platform")

const { soliditySha3, toBN, } = web3.utils


contract('Balances', function (accounts) {
  const ALICE = accounts[0]
  const BOB = accounts[1]

  const AMOUNT_INITIAL = 1000
  const AMOUNT_DEPOSIT = 100
  const AMOUNT_WITHDRAWAL = 50

  const WITHDRAWAL_EXTERNAL_ID_1 = Date.now()
  const WITHDRAWAL_EXTERNAL_ID_2 = WITHDRAWAL_EXTERNAL_ID_1 + 1
  const WITHDRAWAL_EXTERNAL_ID_3 = WITHDRAWAL_EXTERNAL_ID_2 + 1

  let balances, scrinium, platform

  before(async () => {
    scrinium = await Scrinium.deployed()
    balances = await Balances.deployed()
    platform = await Platform.deployed()

    await scrinium.mintToken.sendTransaction(ALICE, AMOUNT_INITIAL)
  })

  it("balanceOf should returns 0 SCR for new accounts", async () => {
    const balance = await balances.balanceOf(ALICE)
    assert.equal(balance.toNumber(), 0)
  })

  it("deposit should works correctly", async () => {
    await scrinium.approve.sendTransaction(Balances.address, AMOUNT_DEPOSIT, { from: ALICE })
    await balances.deposit.sendTransaction(Date.now(), AMOUNT_DEPOSIT, { from: ALICE })

    const balanceOfAliceOnPlatform = await balances.balanceOf(ALICE)
    const balanceOfAliceOnScrinium = await scrinium.balanceOf(ALICE)
    const balanceOfContractOnScrinium = await scrinium.balanceOf(Balances.address)

    assert.equal(balanceOfAliceOnPlatform.toNumber(), AMOUNT_DEPOSIT)
    assert.equal(balanceOfAliceOnScrinium.toNumber(), AMOUNT_INITIAL - AMOUNT_DEPOSIT)
    assert.equal(balanceOfContractOnScrinium.toNumber(), AMOUNT_DEPOSIT)
  })

  it("withdrawal should works correctly", async () => {
    const _msgSig = await web3.eth.sign(soliditySha3(
      ALICE,
      toBN(WITHDRAWAL_EXTERNAL_ID_1),
      toBN(AMOUNT_WITHDRAWAL),
      Balances.address,
    ), ALICE)

    await balances.withdrawal.sendTransaction(
      WITHDRAWAL_EXTERNAL_ID_1,
      AMOUNT_WITHDRAWAL,
      _msgSig,
      { from: ALICE },
    )

    const balanceOfAliceOnPlatform = await balances.balanceOf(ALICE)
    const balanceOfAliceOnScrinium = await scrinium.balanceOf(ALICE)
    const balanceOfContractOnScrinium = await scrinium.balanceOf(Balances.address)

    assert.equal(balanceOfAliceOnPlatform.toNumber(), AMOUNT_DEPOSIT - AMOUNT_WITHDRAWAL)
    assert.equal(balanceOfAliceOnScrinium.toNumber(), AMOUNT_INITIAL - AMOUNT_DEPOSIT + AMOUNT_WITHDRAWAL)
    assert.equal(balanceOfContractOnScrinium.toNumber(), AMOUNT_DEPOSIT - AMOUNT_WITHDRAWAL)
  })

  it("withdrawal should not works for amount greater than balance", async () => {
    const balanceOf = await balances.balanceOf(ALICE)

    try {
      const _msgSig = await web3.eth.sign(soliditySha3(
        ALICE,
        toBN(WITHDRAWAL_EXTERNAL_ID_2),
        toBN(balanceOf + 1),
        Balances.address,
      ), ALICE)

      await balances.withdrawal.sendTransaction(
        WITHDRAWAL_EXTERNAL_ID_2,
        balanceOf + 1,
        _msgSig,
        { from: ALICE },
      )
      assert.fail()
    } catch (error) { }

    const balanceAfter = await balances.balanceOf(ALICE)
    assert.equal(balanceAfter.toNumber(), AMOUNT_DEPOSIT - AMOUNT_WITHDRAWAL)
  })

  it("withdrawal should not works for already existing _externalId", async () => {
    const balanceOf = await balances.balanceOf(ALICE)

    try {
      const _msgSig = await web3.eth.sign(soliditySha3(
        ALICE,
        toBN(WITHDRAWAL_EXTERNAL_ID_1),
        toBN(balanceOf),
        Balances.address,
      ), ALICE)

      await balances.withdrawal.sendTransaction(
        WITHDRAWAL_EXTERNAL_ID_1,
        balanceOf,
        _msgSig,
        { from: ALICE },
      )
      assert.fail()
    } catch (error) {
      const _msgSig = await web3.eth.sign(soliditySha3(
        ALICE,
        toBN(WITHDRAWAL_EXTERNAL_ID_2),
        toBN(balanceOf - 1),
        Balances.address,
      ), ALICE)

      await balances.withdrawal.sendTransaction(
        WITHDRAWAL_EXTERNAL_ID_2,
        balanceOf - 1,
        _msgSig,
        { from: ALICE },
      )
    }

    const balanceAfter = await balances.balanceOf(ALICE)
    assert.equal(balanceAfter.toNumber(), 1)
  })

  it("withdrawal should not works for signature with wrong signer", async () => {
    const balanceOf = await balances.balanceOf(ALICE)

    try {
      const _msgSig = await web3.eth.sign(soliditySha3(
        ALICE,
        toBN(WITHDRAWAL_EXTERNAL_ID_1),
        toBN(balanceOf),
        Balances.address,
      ), BOB)

      await balances.withdrawal.sendTransaction(
        WITHDRAWAL_EXTERNAL_ID_1,
        balanceOf,
        _msgSig,
        { from: ALICE },
      )
      assert.fail()
    } catch (error) {
      const _msgSig = await web3.eth.sign(soliditySha3(
        ALICE,
        toBN(WITHDRAWAL_EXTERNAL_ID_3),
        toBN(balanceOf),
        Balances.address,
      ), ALICE)

      await balances.withdrawal.sendTransaction(
        WITHDRAWAL_EXTERNAL_ID_3,
        balanceOf,
        _msgSig,
        { from: ALICE },
      )
    }

    const balanceAfter = await balances.balanceOf(ALICE)
    assert.equal(balanceAfter.toNumber(), 0)
  })

  it("setPlatform should change allowed platform address", async () => {
    await balances.setPlatformAddress.sendTransaction(platform.address, { from: ALICE })

    assert.equal(
      await balances.platformAddress.call(),
      platform.address,
    )
  })

  it("setPlatform works for owners only", async () => {
    const fakeAddress = "0x0000000000000000000000000000000000000000"

    try {
      await balances.setPlatformAddress.sendTransaction(fakeAddress, { from: BOB }) //BOB want to change platformAddress
      assert.fail()
    } catch (err) { }

    assert.notEqual(
      await balances.platformAddress.call(),
      fakeAddress,
    )
  })

})
