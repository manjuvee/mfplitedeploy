var request = require('request')
var Q = require('q')
var yaml = require('js-yaml')
// var config = require('./config')
const isReachable = require('is-reachable')
var kubernetes = {
  initialize: (params) => {
    kubernetes.containerservice = params.containerservice
    kubernetes.cluster = params.cluster
    kubernetes.region = params.region
    kubernetes.apikey = params.apikey
    kubernetes.iam_url = params.iam_url
    kubernetes.account = params.account
    kubernetes.basic_auth = params.basic_auth
  },

  createSecrets: (params) => {
    var body = params.json
    var defer = Q.defer()
    request({
      rejectUnauthorized: false,
      url: params.cluster_url + '/api/v1/namespaces/default/secrets',
      json: body,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + params.clusterconfig.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, function (error, response, body) {
      if (error || (response.statusCode !== 201 && response.statusCode !== 409)) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
        return
      }
      defer.resolve(params)
    })
    return defer.promise
  },

  createConfigMaps: function (params) {
    var body = params.json
    var defer = Q.defer()
    request({
      rejectUnauthorized: false,
      url: params.cluster_url + '/api/v1/namespaces/default/configmaps',
      json: body,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + params.clusterconfig.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, function (error, response, body) {
      if (error || (response.statusCode !== 201 && response.statusCode !== 409)) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
        return
      }
      defer.resolve(params)
    })
    return defer.promise
  },

  deleteConfigMap: function (cluster_url, token, cm) {
    var defer = Q.defer()
    request({
      rejectUnauthorized: false,
      url: cluster_url + '/api/v1/namespaces/default/configmaps/' + cm,
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, function (error, response, body) {
      if (error || (response.statusCode !== 200 && response.statusCode !== 404)) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
      }else {
        defer.resolve()
      }
    })
    return defer.promise
  },

  createService: function (params) {
    var body = params.json
    var defer = Q.defer()
    request({
      rejectUnauthorized: false,
      url: params.cluster_url + '/api/v1/namespaces/default/services',
      json: body,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + params.clusterconfig.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, function (error, response, body) {
      if (error || (response.statusCode !== 201 && response.statusCode !== 409)) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
        return
      }
      defer.resolve(params)
    })
    return defer.promise
  },

  getService: function (params) {
    var defer = Q.defer()
    request({
      rejectUnauthorized: false,
      url: params.cluster_url + '/api/v1/namespaces/default/services/' + params.label,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + params.clusterconfig.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, function (error, response, body) {
      if (error || (response.statusCode !== 200)) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
        return
      }
      var result = JSON.parse(response.body)
      params.urls = {}
      for (var p in result.spec.ports) {
        params.urls[result.spec.ports[p].name] = result.spec.ports[p].name + '://' +
          params.publicIP + ':' + result.spec.ports[p].nodePort + '/' + params.context
      }
      params.urls.internal = 'http://' + params.label + ':9080'
      // params.urls.http.replace(params.publicIP, params.label)
      defer.resolve(params)
    })
    return defer.promise
  },

  deleteService: function (params) {
    var defer = Q.defer()
    request({
      rejectUnauthorized: false,
      url: params.cluster_url + '/api/v1/namespaces/default/services/' + params.label,
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + params.clusterconfig.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, function (error, response, body) {
      if (error || (response.statusCode !== 200 && response.statusCode !== 404)) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
      }else {
        defer.resolve(params)
      }
    })
    return defer.promise
  },

  createDeployment: function (params) {
    var body = params.json
    var defer = Q.defer()
    request({
      rejectUnauthorized: false,
      url: params.cluster_url + '/apis/extensions/v1beta1/namespaces/default/deployments',
      json: body,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + params.clusterconfig.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, function (error, response, body) {
      if (error || (response.statusCode !== 201 && response.statusCode !== 409)) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
        return
      }
      defer.resolve(params)
    })
    return defer.promise
  },

  deleteDeployment: function (params) {
    var defer = Q.defer()
    request({
      rejectUnauthorized: false,
      url: params.cluster_url + '/apis/extensions/v1beta1/namespaces/default/deployments/' + params.label,
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + params.clusterconfig.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, function (error, response, body) {
      if (error || (response.statusCode !== 200 && response.statusCode !== 404)) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
        return
      }
      defer.resolve(params)
    })
    return defer.promise
  },


  getReplicaSet: function (params) {
    var defer = Q.defer()
    request({
      rejectUnauthorized: false,
      // /apis/extensions/v1beta1/namespaces/default/replicasets?labelSelector=app%3Dmfxtxynctztha
      url: params.cluster_url + '/apis/extensions/v1beta1/namespaces/default/replicasets?labelSelector=app%3D' + params.label,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + params.clusterconfig.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, function (error, response, body) {
      if (error || (response.statusCode !== 200)) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
        return
      }
      var result = JSON.parse(response.body)
      if( result.items && result.items.length && result.items[0].metadata.name){
        params.replicaset = result.items[0].metadata.name
      }
      defer.resolve(params)
    })
    return defer.promise
  },


  deleteReplicaSets: function (params) {
    var defer = Q.defer()
    kubernetes.getReplicaSet(params)
    .then(params => {
      if(params.replicaset){
        request({
          rejectUnauthorized: false,
          url: params.cluster_url + '/apis/extensions/v1beta1/namespaces/default/replicasets/' + params.replicaset,
          method: 'DELETE',
          json: {"kind":"DeleteOptions","apiVersion":"v1","propagationPolicy":"Background"},
          headers: {
            'Authorization': 'Bearer ' + params.clusterconfig.token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }, function (error, response, body) {
          if (error || (response.statusCode !== 200 && response.statusCode !== 404)) {
            defer.reject({
              code: response.statusCode,
              message: response.statusMessage,
              details: error
            })
            return
          }
          defer.resolve(params)
        })
      }else{
        defer.resolve(params)
      }
    })
    return defer.promise
  },

  // getSecrets: function (params) {
  //   var defer = Q.defer()
  //   request({
  //     rejectUnauthorized: false,
  //     url: params.cluster_url + '/api/v1/namespaces/default/secrets?limit=500',
  //     method: 'GET',
  //     headers: {
  //       'Authorization': 'Bearer ' + params.clusterconfig.token,
  //       'Content-Type': 'application/json'
  //     }
  //   }, function (error, response, body) {
  //     if (error || response.statusCode !== 200) {
  //       defer.reject({
  //         code: response.statusCode,
  //         message: response.statusMessage,
  //         details: error
  //       })
  //       return
  //     }
  //     var data = JSON.parse(body)
  //     params.clusters = []
  //     for (var cl in data) {
  //       console.log(data[cl].id + '    ' + data[cl].name + '    ' + data[cl].serverURL)
  //       params.clusters.push({
  //         id: data[cl].id,
  //         name: data[cl].name,
  //         serverURL: data[cl].serverURL
  //       })
  //       if (config.cluster === data[cl].id || config.cluster === data[cl].name) {
  //         params.cluster = data[cl].name
  //       }
  //     }
  //     if (!params.cluster) {
  //       console.log('Please add one of the cluster names  above to config.js / cluster')
  //       defer.reject({
  //         code: 100,
  //         message: 'Cluster not configured in config.js'
  //       })
  //       return
  //     }
  //     defer.resolve(params)
  //   })
  //   return defer.promise
  // },

  // getClusters: function (params) {
  //   console.log('\nRetrieving Clusters')
  //   var defer = Q.defer()
  //   request({
  //     url: config.containerservice_url + '/v1/clusters',
  //     method: 'GET',
  //     headers: {
  //       'Authorization': 'Bearer ' + params.access_token,
  //       'Content-Type': 'application/json',
  //       'X-Region': params.region,
  //       'X-Auth-Resource-Account': params.account
  //     }
  //   }, function (error, response, body) {
  //     if (error || response.statusCode !== 200) {
  //       defer.reject({
  //         code: response ? response.statusCode : 0,
  //         message: response ? response.statusMessage : 'Error',
  //         details: error
  //       })
  //       return
  //     }
  //     var data = JSON.parse(body)
  //     params.clusters = []
  //     for (var cl in data) {
  //       console.log(data[cl].id + '    ' + data[cl].name + '    ' + data[cl].serverURL)
  //       params.clusters.push({
  //         id: data[cl].id,
  //         name: data[cl].name,
  //         serverURL: data[cl].serverURL
  //       })
  //       if (config.cluster === data[cl].id || config.cluster === data[cl].name) {
  //         params.cluster = data[cl].name
  //       }
  //     }
  //     if (!params.cluster) {
  //       console.log('Please add one of the cluster names  above to config.js / cluster')
  //       defer.reject({
  //         code: 100,
  //         message: 'Cluster not configured in config.js'
  //       })
  //       return
  //     }
  //     defer.resolve(params)
  //   })
  //   return defer.promise
  // },

  getWorkers: function (params) {
    console.log('\nRetrieving Worker Nodes')
    var defer = Q.defer()
    request({
      url: kubernetes.containerservice + '/v1/clusters/' + params.cluster + '/workers?showDeleted=false',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + params.access_token,
        'Content-Type': 'application/json',
        'X-Region': params.region,
        'X-Auth-Resource-Account': params.account
      }
    }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
        return
      }
      var data = JSON.parse(body)
      params.workers = []
      for (var wk in data) {
        console.log(data[wk].id + '    ' + data[wk].publicIP + '    ' + data[wk].status)
        params.workers.push({
          id: data[wk].id,
          name: data[wk].publicIP,
          serverURL: data[wk].status
        })
        params.publicIP = data[wk].publicIP
      }
      defer.resolve(params)
    })
    return defer.promise
  },

  getClusterDetails: function (params) {
    console.log('\nRetrieving Details of Cluster - ' + params.cluster)
    var defer = Q.defer()
    request({
      url: kubernetes.containerservice + '/v1/clusters/' + params.cluster,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + params.access_token,
        'Content-Type': 'application/json',
        'X-Region': params.region,
        'X-Auth-Resource-Account': params.account
      }
    }, function (error, response, body) {
      if (error || !response || response.statusCode !== 200) {
        defer.reject({
          code: response && response.statusCode ? response.statusCode : 500,
          message: response && response.statusMessage ? response.statusMessage : "Failed to get cluster details",
          details: error
        })
        return
      }
      var data = JSON.parse(body)
      console.log(data.id + '    ' + data.name + '    ' + data.serverURL + '    ' + data.state)
      params.cluster_url = data.serverURL
      defer.resolve(params)
    })
    return defer.promise
  },

  getClusterWorkers: function (params) {
    console.log('\nRetrieving Details of Cluster - ' + params.cluster)
    var defer = Q.defer()
    request({
      url: kubernetes.containerservice + '/v1/clusters/' + params.cluster + '/workers?showDeleted=false',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + params.access_token,
        'Content-Type': 'application/json',
        'X-Region': params.region,
        'X-Auth-Resource-Account': params.account
      }
    }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
        return
      }
      var data = JSON.parse(body)
      console.log(data[0].publicIP)
      params.cluster_url = data.serverURL
      defer.resolve(params)
    })
    return defer.promise
  },

  getClusterConfig: function (params) {
    console.log('\nRetrieving Configuration for Cluster - ' + params.cluster)
    var defer = Q.defer()
    request({
      url: 'https://containers.bluemix.net' + '/v1/clusters/' + params.cluster + '/config?format=yaml',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + params.access_token,
        'X-Auth-Refresh-Token': params.refresh_token,
        'X-Region': params.region
      }
    }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        defer.reject({
          code: response ? response.statusCode : 0,
          message: response ? response.statusMessage : 'Errro',
          details: error
        })
        return
      }
      try {
        var clusterconfig = yaml.safeLoad(body)
        params.clusterconfig = {
          token: clusterconfig.users[0].user['auth-provider'].config['id-token'],
          refreshtoken: clusterconfig.users[0].user['auth-provider'].config['refresh-token']
        }
      } catch (e) {
        console.log(e)
      }
      defer.resolve(params)
    })
    return defer.promise
  },

  login: function (params) {
    var defer = Q.defer()
    request({
      url: kubernetes.iam_url + '/identity/token', // ?account=' + params.account
      method: 'POST',
      form: {
        'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
        'apikey': params.apikey,
        'response_type': 'cloud_iam'
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, function (error, response, body) {
      if (error || !response || response.statusCode !== 200) {
        defer.reject({
          code: response && response.statusCode ? response.statusCode : 500,
          message: response && response.statusMessage ? response.statusMessage : "Kubernetes login failed",
          details: error
        })
        return
      }
      var data = JSON.parse(response.body)
      params.access_token = data.access_token
      params.refresh_token = data.refresh_token
      defer.resolve(params)
    })
    return defer.promise
  },

  refreshTokenWithBx2: function (params) {
    var defer = Q.defer()
    params.authorization = kubernetes.basic_auth

    request({
      url: 'https://iam.bluemix.net/oidc/token',
      method: 'POST',
      form: {
        'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
        'apikey': params.apikey,
        'response_type': 'cloud_iam',
        'account': params.account
      },
      headers: {
        'Accept': 'application/json',
        'Authorization': params.authorization,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        defer.reject({
          code: response.statusCode,
          message: response.statusMessage,
          details: error
        })
        return
      }
      var data = JSON.parse(response.body)
      params.access_token = data.access_token
      // params.uaa_token = data.uaa_token ? data.uaa_token : params.uaa_token;
      params.refresh_token = data.refresh_token
      defer.resolve(params)
    })
    return defer.promise
  },

  checkConnection: function (params, defer, timeout) {
    defer = defer || Q.defer()
    if (!timeout) {
      timeout = 480000 // default of 10 seconds
      setTimeout(function () {
        defer.reject('timeout')
      }, timeout)
    }
    var canReach = function () {
      isReachable(params.urls.http).then(reachable => {
        if (reachable) {
          defer.resolve(params)
        } else {
          setTimeout(function () {
            canReach()
          }, 10000)
        }
      })
    }
    canReach()
    return defer.promise
  },

  authenticate: function (params) {
    var defer = Q.defer()
    kubernetes.login(params)
      .then(function (params) {
        return kubernetes.getClusterDetails(params)
      })
      .then(function (params) {
        return kubernetes.getWorkers(params)
      })
      .then(function (params) {
        return kubernetes.refreshTokenWithBx2(params)
      })
      .then(function (params) {
        return kubernetes.getClusterConfig(params)
      })
      .then(() => {
        defer.resolve(params)
      })
    return defer.promise
  }

}
module.exports = kubernetes
