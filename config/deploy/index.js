const Validator = require('validatorjs')

Validator.register('ethereumAddress', function (value) {
  return value.match(/^0x[0-9a-fA-F]{40}$/)
}, 'The :attribute is not a valid Ethereum address !')

module.exports = network => {

  const config = require(`${process.cwd()}/config/deploy/${network}`)

  const configValidationSchema = {
    'commissionsAddress': 'required|ethereumAddress',
  }

  const configValidation = new Validator(config, configValidationSchema)

  if (configValidation.fails()) {

    const configValidationErrors = configValidation.errors.all()

    throw Error(`There are an errors in the deployment configuration file!

      ${JSON.stringify(configValidationErrors)}

    `)
  }

  return config
}
