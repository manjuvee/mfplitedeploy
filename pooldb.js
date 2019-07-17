/*
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2016. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
var Cloudant = require('cloudant')
var Q = require('q')
var db = null
var initialize = function (config, callback) {
  var defer = Q.defer()
  db = Cloudant(config.url).db
  db.create(config.db, function (err, status, data) {
    if (err && err.error !== 'file_exists') {
      defer.reject(err)
    } else {
      db = db.use(config.db)
      defer.resolve()
    }
  })
  return defer.promise
}

var insert = function (doc, id, trial, defer) {
  defer = defer || Q.defer()
  trial = trial || []
  db.insert(doc, id, function (err, body, header) {
    if (err) {
      trial.push(err)
      if (trial.length < 5) {
        insert(doc, id, trial, defer)
      } else {
        defer.reject(trial)
      }
    } else {
      defer.resolve({
        doc: body,
        trial: trial
      })
    }
  })
  return defer.promise
}

var update = function (doc, id, trial, defer) {
  defer = defer || Q.defer()
  trial = trial || []
  db.get(id, function (err, data) {
    if (err) {
      trial.push(err)
      defer.reject(trial)
    } else {
      if (doc.instance) {
        data.instance = doc.instance
      }
      if (doc.urls) {
        data.urls = doc.urls
      }
      data.label = doc.label ? doc.label : data.label
      data.db = doc.db ? doc.db : data.db
      data.analytics = doc.analytics ? doc.analytics : data.analytics
      data.status = doc.status ? doc.status : data.status
      data.url = doc.url ? doc.url : data.url
      data.password = doc.password ? doc.password : data.password
      if(doc.deleted){
        data.deleted = doc.deleted
      }

      db.insert(data, id, function (err, body, header) {
        if (err) {
          trial.push(err)
          if (trial.length < 5) {
            setTimeout(function () {
              update(doc, id, trial, defer)
            }, 200)
          } else {
            defer.reject(trial)
          }
        } else {
          defer.resolve({
            data: body,
            trial: trial
          })
        }
      })
    }
  })
  return defer.promise
}

var read = function (id) {
  var defer = Q.defer()
  db.get(id, function (err, data) {
    if (err) {
      defer.reject(err)
    } else {
      defer.resolve(data)
    }
  })
  return defer.promise
}

var findActive = function (callback, errorcallback) {
  db.find({
    'selector': {
      'created': {
        '$gt': 0
      }
    }
  }, function (err, data) {
    if (err && errorcallback) {
      errorcallback(err)
    } else {
      callback(data)
    }
  })
}

// var poolupdate = function (doc, id, trial) {
//   var attempt = trial || 0
//   db.insert(doc, id, function (err, body, header) {
//     if (err) {
//       // console.log("Error: Data not updated for instance " + id + ". Attempt " + attempt + " _rev " + newdata._rev);
//       if (attempt > 2) {
//         console.log(err.message)
//         console.log(doc)
//       }
//       if (attempt++ < 5) {
//         console.log('Retrying update for instance ' + id + '. Attempt ' + attempt)
//         setTimeout(function () {
//           poolupdate(doc, id, attempt)
//         }, 200)
//       } else {
//         console.log('Error: Data not updated for instance ' + id + '. Attempt ' + attempt + ' _rev ' + newdata._rev)
//       }
//     } else if (attempt > 0) {
//       console.log('Data updated for instance ' + id + '. Attempt ' + attempt)
//     } else {
//       console.log('Data updated for instance ' + id)
//     }
//   })
// }

exports.getPoolInstance = function (instanceid) {
  var defer = Q.defer()
  var searchquery = {
    'selector': {
      'status': {
        '$eq': 'available'
      }
    }
  }
  db.find(searchquery, function (err, body) {
    if (!err) {
      if (body.docs.length > 0) {
        var data = {}
        data = body.docs[0]
        update({status:'assigned', instance:instanceid}, data._id)
        // poolupdate(newdata, newdata._id)
        var result = {
          instance: instanceid,
          analytics: data.analytics,
          user: 'admin',
          password: data.password,
          urls: data.urls
        }
        defer.resolve(result)
      } else {
        defer.resolve({
          Message: 'No Instance Found'
        })
      }
    } else {
      defer.reject(err)
    }
  })
  return defer.promise
}

exports.getNumberOfAvailableInstances = function () {
  var defer = Q.defer()
  var searchquery = {
    'selector': {
      'status': {
        '$eq': 'available'
      }
    }
  }

  db.find(searchquery, function (err, body) {
    if (!err) {
      defer.resolve({
        count: body.docs.length
      })
    } else {
      defer.reject(err)
    }
  })
  return defer.promise
}

exports.getPoolInstacneDetails = function (id) {
  var defer = Q.defer()
  db.get(id, function (err, data) {
    if (err) {
      defer.reject(err)
    } else {
      defer.resolve(data)
    }
  })
  return defer.promise
}

exports.getAlocatedInstance = function (instance) {
  var defer = Q.defer()
  db.find({
    'selector': {
      'instance': {
        '$eq': instance
      }
    }
  }, function (err, data) {
    if (err) {
      defer.reject(err)
    } else {
      defer.resolve(data.docs[0])
    }
  })
  return defer.promise
}
/// /////////////////////////
exports.initialize = initialize
exports.insert = insert
exports.get = read
exports.update = update
// exports.activeinstances = findActive
