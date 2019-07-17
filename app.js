var express = require('express')
var cookieParser = require('cookie-parser')
var http = require('http')
var kubernetes = require('./kubernetes')
var config = require('./config')
var app = express()
var Q = require('q')
// const YAML = require('yaml').default
const uuidv4 = require('uuid/v4')
app.use(express.json())
app.use(
  express.urlencoded({
    extended: false
  })
)
app.use(cookieParser())

app.post('/delete', function (req, res) {
  if(req.body && req.body.instance){
    var params = {instance : req.body.instance}
    console.log('Deleting instance ' + params.instance)
      teardown(params)}
   
      res.status(200).json({})
      console.log('Done deleting')
    
})

app.use('/deployimage/:instance', function (rq, rs) {
  console.log('Deployment Started')
  analyticsDeploy();
  rs.status(200).send('{}')

})


var appCenterDeploy = () => {
  console.log('Starting deployment')
  var defer = Q.defer()

  var params = {
    apikey: config.APIKEY,
    region: config.REGION,
    image: config.IMAGE,
    account: config.ACCOUNT_ID,
    cluster: config.CLUSTER_NAME,
    password: 'demo',
    start: new Date(),
    label:'mfp-appcenter'
  }
  console.log('Starting deployment ' + JSON.stringify(params))
    kubernetes.authenticate(params)
    .then(function (params) {
      console.log('Creating Deployment')
      params.json = require('./mfp-appcenter-deployment.json')

      params.json.metadata.name = params.label
      params.json.metadata.labels.app = params.label
      params.json.spec.template.metadata.labels.app = params.label
      params.json.spec.template.spec.containers[0].name = params.label

      params.json.spec.template.spec.containers[0].image = params.image
      
      // for (let i in params.json.spec.template.spec.volumes) {
      //   if (params.json.spec.template.spec.volumes[i].name === 'dbconfig-volume') {
      //     params.json.spec.template.spec.volumes[i].configMap.name = 'db-' + params.label
      //   }
      // }
      // console.log(JSON.stringify(params.json))
      return kubernetes.createDeployment(params)
    })
    .then(function (params) {
      console.log('Created deployment ' + params.label)
      console.log('Creating Service')
      params.json = require('./mfp-appcenter-service.json')

      params.json.metadata.name = params.label
      params.json.metadata.labels.app = params.label
      params.json.spec.selector.app = params.label
      return kubernetes.createService(params)
    })

    .then(function (params) {
      console.log('Created service ' + params.label)
      var defer = Q.defer()
      setTimeout(function () {
        defer.resolve(params)
      }, 5000)
      return defer.promise
    })

    .then(function (params) {
      console.log('Getting Service Details ' + params.label)
      params.context = 'appcenterconsole';
      return kubernetes.getService(params)
    })
    .then(function (params) {
      console.log('Checking Server Status ' + params.label)
      return kubernetes.checkConnection(params)
    })
    .then(function (params) {
      params.end = new Date()
      console.log(params.end - params.start)
      console.log('Server is ready ' + params.label)
      console.log(params.urls.http)
      console.log(params.urls.https)
      defer.resolve(params)
    })
    .catch(function (error) {
      console.log('Deployment failed ' + params.label)
      console.log(error.code + ':' + error.message)
      console.log(error.details ? error.details : '')
      defer.reject(error)
    })
  return defer.promise
}

var mfpDeploy = () => {
  console.log('Starting deployment')
  var defer = Q.defer()

  var params = {
    apikey: config.APIKEY,
    region: config.REGION,
    image: config.IMAGE,
    account: config.ACCOUNT_ID,
    cluster: config.CLUSTER_NAME,
    password: 'admin',
    start: new Date(),
    label: 'mfp-server'
  }
  console.log('Starting deployment ' + JSON.stringify(params))
  kubernetes.authenticate(params)
    .then(function (params) {
      console.log('Creating Deployment')
      params.json = require('./mfp-deployment.json')

      params.json.metadata.name = params.label
      params.json.metadata.labels.app = params.label
      params.json.spec.template.metadata.labels.app = params.label
      params.json.spec.template.spec.containers[0].name = params.label

      params.json.spec.template.spec.containers[0].image = params.image

      // for (let i in params.json.spec.template.spec.volumes) {
      //   if (params.json.spec.template.spec.volumes[i].name === 'dbconfig-volume') {
      //     params.json.spec.template.spec.volumes[i].configMap.name = 'db-' + params.label
      //   }
      // }
      // console.log(JSON.stringify(params.json))
      return kubernetes.createDeployment(params)
    })
    .then(function (params) {
      console.log('Created deployment ' + params.label)
      console.log('Creating Service')
      params.json = require('./mfp-service.json')

      params.json.metadata.name = params.label
      params.json.metadata.labels.app = params.label
      params.json.spec.selector.app = params.label
      return kubernetes.createService(params)
    })

    .then(function (params) {
      console.log('Created service ' + params.label)
      var defer = Q.defer()
      setTimeout(function () {
        defer.resolve(params)
      }, 5000)
      return defer.promise
    })

    .then(function (params) {
      console.log('Getting Service Details ' + params.label)
      params.context = 'mfpconsole';
      return kubernetes.getService(params)
    })
    .then(function (params) {
      console.log('Checking Server Status ' + params.label)
      return kubernetes.checkConnection(params)
    })
    .then(function (params) {
      params.end = new Date()
      console.log(params.end - params.start)
      console.log('Server is ready ' + params.label)
      console.log(params.urls.http)
      console.log(params.urls.https)
      defer.resolve(params)
    })
    .catch(function (error) {
      console.log('Deployment failed ' + params.label)
      console.log(error.code + ':' + error.message)
      console.log(error.details ? error.details : '')
      defer.reject(error)
    })
  return defer.promise
}

var analyticsDeploy = () => {
  console.log('Starting deployment')
  var defer = Q.defer()

  var params = {
    apikey: config.APIKEY,
    region: config.REGION,
    image: config.IMAGE,
    account: config.ACCOUNT_ID,
    cluster: config.CLUSTER_NAME,
    password: 'admin',
    start: new Date(),
    label: 'mfp-analytics'
  }
  console.log('Starting deployment ' + JSON.stringify(params))
  kubernetes.authenticate(params)
    .then(function (params) {
      console.log('Creating Deployment')
      params.json = require('./mfp-analytics-deployment.json')

      params.json.metadata.name = params.label
      params.json.metadata.labels.app = params.label
      params.json.spec.template.metadata.labels.app = params.label
      params.json.spec.template.spec.containers[0].name = params.label

      params.json.spec.template.spec.containers[0].image = params.image

      // for (let i in params.json.spec.template.spec.volumes) {
      //   if (params.json.spec.template.spec.volumes[i].name === 'dbconfig-volume') {
      //     params.json.spec.template.spec.volumes[i].configMap.name = 'db-' + params.label
      //   }
      // }
      // console.log(JSON.stringify(params.json))
      return kubernetes.createDeployment(params)
    })
    .then(function (params) {
      console.log('Created deployment ' + params.label)
      console.log('Creating Service')
      params.json = require('./mfp-analytics-service.json')

      params.json.metadata.name = params.label
      params.json.metadata.labels.app = params.label
      params.json.spec.selector.app = params.label
      return kubernetes.createService(params)
    })

    .then(function (params) {
      console.log('Created service ' + params.label)
      var defer = Q.defer()
      setTimeout(function () {
        defer.resolve(params)
      }, 5000)
      return defer.promise
    })

    .then(function (params) {
      console.log('Getting Service Details ' + params.label)
      params.context = 'analytics/console';
      return kubernetes.getService(params)
    })
    .then(function (params) {
      console.log('Checking Server Status ' + params.label)
      return kubernetes.checkConnection(params)
    })
    .then(function (params) {
      params.end = new Date()
      console.log(params.end - params.start)
      console.log('Server is ready ' + params.label)
      console.log(params.urls.http)
      console.log(params.urls.https)
      defer.resolve(params)
    })
    .catch(function (error) {
      console.log('Deployment failed ' + params.label)
      console.log(error.code + ':' + error.message)
      console.log(error.details ? error.details : '')
      defer.reject(error)
    })
  return defer.promise
}

var teardown = (params) => {
  console.log('Starting teardown ' + params.instance )
  var defer = Q.defer()

  params.apikey = config.APIKEY
  params.region = config.REGION
  params.image = config.IMAGE
  params.account = config.ACCOUNT_ID
  params.cluster = config.CLUSTER_NAME
  params.start = new Date()

  kubernetes.authenticate(params)
    .then(function (params) {
      console.log('Logged in to Kube ' + params.label)
      console.log('Deleting configmap ' + params.label)
      return kubernetes.deleteConfigMap(params.cluster_url, params.clusterconfig.token, params.label)
    })
    .then(function () {
      console.log('Deleting DB configmap ' + params.label)
      return kubernetes.deleteConfigMap(params.cluster_url, params.clusterconfig.token, (params.label + '-db'))
    })
    .then(function () {
      console.log('Deleting deployment ' + params.label)
      return kubernetes.deleteDeployment(params)
    })
    .then(function (params) {
      console.log('Deleting service ' + params.label)
      return kubernetes.deleteService(params)
    })
    .then(function () {
      console.log('Deleting replicasets ' + params.label)
      return kubernetes.deleteReplicaSets(params)
    })
    .then(function (params) {
      console.log('Kubernetes deployment deleted ' + params.label)
      defer.resolve(params)
    })
    .catch(function (error) {
      console.log('Deployment deletion failed ' + params.label)
      console.log(error.code + ':' + error.message)
      console.log(error.details ? error.details : '')
      defer.reject(error)
    })
  return defer.promise
}

var configuration = config.initialize()
if (configuration) {
      kubernetes.initialize({
        containerservice: config.CONTAINER_SERVICE,
        cluster: config.CLUSTER_NAME,
        region: config.REGION,
        apikey: config.APIKEY,
        iam_url: config.IAM_URL,
        account: config.ACCOUNT_ID,
        basic_auth: config.basic_auth
      })
      var server = http.createServer(app)
      server.listen(process.env.PORT || 5000)
      server.on('error', function onError (error) {
        console.log(JSON.stringify(error))
      })
      server.on('listening', function onListening () {
        var addr = server.address()
        console.log('Listening on ' + addr.port)
      })
} else {
  console.error('Check configuration parameters')
}

