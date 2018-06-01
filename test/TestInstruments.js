var Instruments = artifacts.require("Instruments");

contract('Instruments', function(accounts) {
  var instruments;
  var alice = accounts[0];

  before(async () => {
    instruments = await Instruments.new();
  });

  it("instruments.add should works correctly", async () => {
    await instruments.add.sendTransaction(1, 'EURUSD', 3, {from:alice});

    var eurusd = await instruments.data.call(1);
    assert.equal(eurusd[0], 'EURUSD');
    assert.equal(eurusd[1], 3);
  });

  it("instruments.isCorrect should works correctly", async () => {
    await instruments.add.sendTransaction(1, 'EURUSD', 3, {from:alice});

    assert.equal(await instruments.isCorrect(1), true);
    assert.equal(await instruments.isCorrect(2), false);
  });
});
