const debug = require('debug')('test:Instruments')

var Instruments = artifacts.require("Instruments")


const utf8ToBytes = str => web3.utils.hexToBytes(web3.utils.utf8ToHex(str))

contract('Instruments', function(accounts) {
  const ALICE = accounts[0]

  let instruments

  before(async () => {
    instruments = await Instruments.new()
  })

  it("instruments.add should works correctly", async () => {
    await instruments.add.sendTransaction(1, utf8ToBytes('EURUSD'), 3, { from: ALICE })

    const instrument = await instruments.instruments.call(1)

    assert.equal(web3.utils.hexToUtf8(instrument[0]), 'EURUSD')
    assert.equal(instrument[1], 3)
  })

  it("instruments.isCorrect should works correctly", async () => {
    await instruments.add.sendTransaction(1, utf8ToBytes('EURUSD'), 3, { from: ALICE })

    assert.equal(await instruments.isCorrect(1), true)
    assert.equal(await instruments.isCorrect(2), false)
  })
})
