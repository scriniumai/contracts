// Specifically request an abstraction for MetaCoin
var Scrinium = artifacts.require("Scrinium");
var Balances = artifacts.require("Balances");

contract('Balances', function(accounts) {
  var balances, scrinium;
  var alice = accounts[0];
  var bob = accounts[1];

  before(async () => {
    scrinium = await Scrinium.deployed();
    await scrinium.mintToken.sendTransaction(alice, 1000); //alice has 1000 SCR

    balances = await Balances.deployed();
  });

  it("balanceOf should returns 0 SCR for new accounts", async () => {
    var balance = await balances.balanceOf(alice);
    assert.equal(balance.valueOf(), 0, "0 SCR should be on first account after deploing contract");
  });

  it("deposit should works correctly: 100SCR from alice", async () => {
    // 1. Alice allows to use 100 SCR for Balances
    await scrinium.approve.sendTransaction(Balances.address, 100, {from: alice});

    // 2. Alice deposits 100 SRC to contract
    await balances.deposit.sendTransaction(100, {from: alice});

    // Assertions:
    var balanceOfAliceOnPlatform = await balances.balanceOf(alice);
    var balanceOfAliceOnScrinium = await scrinium.balanceOf(alice);
    var balanceOfContractOnScrinium = await scrinium.balanceOf(Balances.address);

    assert.equal(balanceOfAliceOnPlatform, 100, "alice should receive 100 SCR on Balances");
    assert.equal(balanceOfAliceOnScrinium, 900, "alice should keep 1000-100 SCR");
    assert.equal(balanceOfContractOnScrinium, 100, "contract Balances should receive 100 SCR from alice");

    // tearDown - withdrawal all deposited SCR
    await balances.withdrawal.sendTransaction(100, {from: alice});
  });

  it("withdrawal should works correctly: 50SCR to alice", async () => {
    // 1. Alice approve and deposit 100 SCR to Balances
    await scrinium.approve.sendTransaction(Balances.address, 100, {from: alice});
    await balances.deposit.sendTransaction(100, {from: alice});

    // 2. Alice withdrawal 30 SCR
    await balances.withdrawal.sendTransaction(30, {from: alice});

    // Assertions:
    var balanceOfAliceOnPlatform = await balances.balanceOf(alice);
    var balanceOfAliceOnScrinium = await scrinium.balanceOf(alice);
    var balanceOfContractOnScrinium = await scrinium.balanceOf(Balances.address);

    assert.equal(balanceOfAliceOnPlatform, 100-30, "alice should view 70SCR on balances");

    assert.equal(balanceOfAliceOnScrinium, 1000-100+30, "alice should view 930 SRC on Scrinium");
    assert.equal(balanceOfContractOnScrinium, 100-30, "contract Balances should keep 70SCR on alice's address");

    // tearDown - withdrawal all deposited SCR
    await balances.withdrawal.sendTransaction(70, {from: alice});
  });

});
