const fs = require('fs')

/**
 * data = {
 *    <contractVariableName>: {
 *      <comment>,
 *      <abi>,
 *      <address>
 *    }
 * }
 */

module.exports = (network, data, truncate = false) => {

  const filePath = `${process.cwd()}/preload-${network}.js`

  let code = ''

  for (const contractVariableName in data) {
    const { comment, abi, address } = data[contractVariableName]

    code += `
// ${comment || ''}
var ${contractVariableName} = eth.contract(JSON.parse('${JSON.stringify(abi)}')).at('${address}')
`
  }

  fs[truncate ? 'writeFileSync' : 'appendFileSync'](filePath, code)

  return Promise.resolve()
}