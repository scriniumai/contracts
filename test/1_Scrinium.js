const debug = require('debug')('test:Scrinium')

const Scrinium = artifacts.require("Scrinium")

contract('Scrinium', function(accounts) {
  let scrinium

  before(async () => {
    scrinium = await Scrinium.deployed()
  })

  it("balanceOf should returns 0 SCR for new accounts", async () => {
    const balance = await scrinium.balanceOf(accounts[0])
    assert.equal(balance.toNumber(), 0, "0 SCR should be on first account after deploing contract")
  })

  it("mintToken should mint SCR for given accounts", async () => {
    await scrinium.mintToken.sendTransaction(accounts[0], 1000)

    const balance = await scrinium.balanceOf(accounts[0])
    assert.equal(balance.toNumber(), 1000, "1000 SCR should be on first account")
  })

  // it("mintToken should not mint SCR over hardcap", async () => {
  //   var hardcap = await scrinium.hardcap.call()

  //   try {
  //     await scrinium.mintToken.sendTransaction(accounts[1], hardcap + 1)
  //   } catch (error) {
  //   }

  //   var balance = await scrinium.balanceOf(accounts[1])
  //   assert.equal(balance.toNumber(), 0, "Balance should be empty")
  // })

  it("transfer should move SCR accross accounts", async () => {
    const alice = accounts[0]
    const bob = accounts[1]

    let balanceAlice = await scrinium.balanceOf(alice)
    let balanceBob = await scrinium.balanceOf(bob)
    assert.equal(balanceAlice.toNumber(), 1000) // already minted 1000 SCR
    assert.equal(balanceBob.toNumber(), 0)

    await scrinium.transfer.sendTransaction(bob, 300, {from: alice})


    balanceAlice = await scrinium.balanceOf(alice)
    balanceBob = await scrinium.balanceOf(bob)
    assert.equal(balanceAlice.toNumber(), 700)
    assert.equal(balanceBob.toNumber(), 300)

    // tearDown for test
    await scrinium.transfer.sendTransaction(alice, 300, {from: bob})
  })

})
