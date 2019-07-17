var configurations = {
  // account:'9f0932da3fdba1bc34094fcb8d81c8b3',
  // region: 'us-south',
  // containerservice: 'http://containers.bluemix.net',
  // cluster: 'mf-lite',
  // cluster: 'schn',
  // apikey: 'LhF2ej_eC42kdzDyb-A43alkoyOUq6SUa0JzQJCxsa70', //schn
  // image: 'registry.ng.bluemix.net/schn/mfp-server-professional:1.0',
  // account: '2fd203a53d9025d28559b6ad1a3ba13c',
  // apikey: 'iu1VJ-fQc-aeX1kVbBVPHHBveegcKDsU3p_-uNGTJMw9', // blueimpus
  basic_auth: 'Basic Yng6Yng=', // bx:bx

  // containerservice_url:  'http://us-south.containers.bluemix.net',

  // iam_url: 'https://iam.bluemix.net',
  // image: 'registry.ng.bluemix.net/mfdev/mfp-server-professional:1.0',

  // postgre_server: 'sl-us-south-1-portal.23.dblayer.com',
  // postgre_port: '38452',

  // account_url: 'http://accountmanagement.bluemix.net',
  // mccp_url: 'http://mccp.ng.bluemix.net',
  // basic_auth: 'Basic bWxJVzJQaUZoQ1F3OlhEN0JoRm1ndFlPUQ==',

  // account: '6768fc23543ad7e04f5c42dc33ed150d',
  // iam_url: 'https://iam.stage1.bluemix.net',
  // containerservice_url:  'http://containers.stage1.bluemix.net',
  // account_url: 'http://accountmanagement.stage1.bluemix.net',
  // basic_auth: 'Basic WHEyQVNtY3h2UGpFOks0cmk4MzhYWU9EeA==',

  // postgresql_host: 'sl-us-south-1-portal.23.dblayer.com:38452',
  // postgresql_admin: 'admin',
  // postgresql_password: 'KOFAYMCDEXLCDBVT',

  'dummy': '',

  initialize: () => {
    var configparams = [
      'REGION',
      'CONTAINER_SERVICE',
      'CLUSTER_NAME',
      'ACCOUNT_ID',
      'APIKEY',
      'IAM_URL',
      'IMAGE'
    ]

    for (var i = 0; i < configparams.length; i++) {
      if (process.env.hasOwnProperty(configparams[i])) {
        configurations[configparams[i]] = process.env[configparams[i]]
      } else {
        console.error('Failed to read ' + configparams[i] + ' from environment variables')
        return false
      }
    }
    return true
  }
}
module.exports = configurations
