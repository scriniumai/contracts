// Specifically request an abstraction for MetaCoin
var Scrinium = artifacts.require("Scrinium");
var DemoBalances = artifacts.require("DemoBalances");

contract('DemoBalances', function(accounts) {
  var demoBalances;
  var alice = accounts[0];

  before(async () => {
    demoBalances = await DemoBalances.deployed();
  });

  it("deposit should increase account's balance", async () => {
    var balanceBefore = await demoBalances.balanceOf(alice);
    assert.equal(balanceBefore, 0, "Alice dont have any coins in demoBalances");

    // Alice just deposit 100 * -10^8 SRC
    await demoBalances.deposit.sendTransaction(100, {from: alice});

    var balanceAfter = await demoBalances.balanceOf(alice);
    assert.equal(balanceAfter, 100, "Alice just received 100 SCR");

    // tearDown
    await demoBalances.withdrawal.sendTransaction(100, {from: alice});
  });

  it("deposit cannot increase balance when amount > 1'000 * 10^8", async () => {
    var balanceBefore = await demoBalances.balanceOf(alice);
    assert.equal(balanceBefore, 0, "Alice dont have any coins in demoBalances");

    try {
      await demoBalances.deposit.sendTransaction(1001 * 10**8, {from: alice});
      assert.fail('Deposit should not be passed');
    } catch (err) {}

    var balanceAfter = await demoBalances.balanceOf(alice);
    assert.equal(balanceAfter, 0, "Alice do not received any SCR");
  });

  it("deposit cannot increase balance when balance > 10'000 * 10^8", async () => {
    var balanceBefore = await demoBalances.balanceOf(alice);
    assert.equal(balanceBefore, 0, "Alice dont have any coins in demoBalances");

    for (var i = 0; i < 10; i++) {
      await demoBalances.deposit.sendTransaction(1000 * 10 ** 8, {from: alice});
    }
    var balanceAfter = await demoBalances.balanceOf(alice);
    assert.equal(balanceAfter, 10000 * 10**8, "Alice received 10000 * 10**8");

    try {
      await demoBalances.deposit.sendTransaction(100, {from: alice});
      assert.fail('Deposit should not be passed');
    } catch (err) {}

    var balanceAfterError = await demoBalances.balanceOf(alice);
    assert.equal(balanceAfterError, 10000 * 10**8, "Alice dont received any more");

    // tearDown
    await demoBalances.withdrawal.sendTransaction(10000 * 10**8, {from: alice});
  });


  it("withdrawal should works correctly", async () => {
    // Alice just deposit 100 * -10^8 SRC
    await demoBalances.deposit.sendTransaction(100, {from: alice});

    // Alice just withdrawal 30 * -10^8 SRC
    await demoBalances.withdrawal.sendTransaction(30, {from: alice});

    var balanceAfter = await demoBalances.balanceOf(alice);
    assert.equal(balanceAfter, 100-30, "Alice's balance should be equal 70 SCR");

    // tearDown
    await demoBalances.withdrawal.sendTransaction(70, {from: alice});
  });

  it("withdrawal not works for amount greater than balance", async () => {
    await demoBalances.deposit.sendTransaction(100, {from: alice});

    // Alice trying to withdrawal 101 * -10^8 SRC
    try {
      await demoBalances.withdrawal.sendTransaction(101, {from: alice});
      assert.fail('Withdrawal should not pass');
    } catch (err) {}

    var balanceAfter = await demoBalances.balanceOf(alice);
    assert.equal(balanceAfter, 100, "Alice's balance should be equal 70 SCR");

    // tearDown
    await demoBalances.withdrawal.sendTransaction(100, {from: alice});
  });


  it("setPlatform should change allowed platform address", async () => {
    var address = "0x0000000000000000000000000000000000000001";
    await demoBalances.setPlatform.sendTransaction(address, {from: alice});

    assert.equal(
      await demoBalances.platformAddress.call(),
      address,
      "Alice change platformAddress"
    );
  });

  it("setPlatform works for owners only", async () => {
    var fakeAddress = "0x0000000000000000000000000000000000000003";

    try {
      await demoBalances.setPlatform.sendTransaction(fakeAddress, {from: bob}); //bob want to change platformAddress
      assert.fail('Bob cannot change platformAddress');
    } catch (err) {}

    assert.notEqual(
      await demoBalances.platformAddress.call(),
      fakeAddress,
      "Bob cannot change platformAddress"
    );
  });

  it("setScriniumAddress should change scriniumAddress", async () => {
    var newContractAddress = "0x0000000000000000000000000000000000000004";

    await demoBalances.setScriniumAddress.sendTransaction(newContractAddress, {from: alice});

    assert.equal(
        await demoBalances.scriniumAddress.call(),
        newContractAddress,
        "Alice changed scriniumAddress"
    );
  });

  it("setScriniumAddress works for owners only", async () => {
    var fakeAddress = "0x0000000000000000000000000000000000000005";

    try {
      await demoBalances.setScriniumAddress.sendTransaction(fakeAddress, {from: bob}); //bob want to change platformAddress
      assert.fail('Bob cannot change platformAddress');
    } catch (err) {}

    assert.notEqual(
        await demoBalances.scriniumAddress.call(),
        fakeAddress,
        "Bob cannot change platformAddress"
    );
  });
});
