module.exports = (deployer, network, accounts) => {

  global.writeGethClientPreload(
    network,
    global.dataForWriting,
    true
  )

  global.writeContractsOutside(
    network,
    {
      contracts: global.dataForWriting
    },
  )

  return Promise.resolve()
}