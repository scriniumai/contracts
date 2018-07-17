module.exports = (deployer, network, accounts) => {

  global.writeGethClientPreload = require('../utils/writeGethClientPreload')
  global.writeContractsOutside = require('../utils/writeContractsOutside')
  global.omitMigration = require('../utils/omitMigration')

  global.dataForWrinting = {}

  return Promise.resolve()
}
