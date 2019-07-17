/*
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2016. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

// cloudantclient.js
var Cloudant = require('cloudant')
var Q = require('q')
var db = null
var initialize = function (config, callback) {
  db = Cloudant(config.url).db
  db.create(config.db, function (err, status, data) {
    if (err && err.error != 'file_exists') {
      console.log('Error creating Database' + JSON.stringify(err))
      throw err
    } else {
      db = db.use ? db.use(config.db) : db
      // db.index( {name:'deletionindex', type:'json', index:{fields:['deleted', 'space.guid', 'org.guid']}});
      // db.index( {name:'creationtimeindex', type:'json', index:{fields:['created']}});
      callback()
    }
  })
}

var insert = function (doc, id, trial, defer) {
  var defer = defer || Q.defer()
  trial = trial || 0
  db.insert(doc, id, function (err, body, header) {
    if (err) {
      console.log('CLOUDANT ERROR - ' + 'Data not inserted for instance - ' + id)
      console.log(JSON.stringify(err))
      if (trial < 5) {
        insert(doc, id, ++trial, defer)
      } else {
        console.log('CLOUDANT ERROR - ' + 'Data not inserted for instance - ' + id)
        defer.reject({ message: 'CLOUDANT ERROR - ' + 'Data not inserted for instance - ' + id })
      }
    } else {
      defer.resolve(doc)
    }
  })
  return defer.promise
}

var update = function (doc, id, trial) {
  var attempt = trial || 0
  db.get(id, function (err, data) {
    if (data) {
      var newdata = { _rev: data._rev /*, _id : data._id */ }
      newdata.instance = doc.instance
      newdata.label = doc.label ? doc.label : data.label
      newdata.schema = doc.schema ? doc.schema : data.schema
      newdata.status = doc.status ? doc.status : data.status
      newdata.url = doc.url ? doc.url : data.url
      newdata.user = doc.user ? doc.user : data.user
      newdata.password = doc.password ? doc.password : data.password

      db.insert(newdata, id, function (err, body, header) {
        if (err) {
          // console.log("Error: Data not updated for instance " + id + ". Attempt " + attempt + " _rev " + newdata._rev);
          if (attempt > 2) {
            console.log(err.message)
            console.log(doc)
          }
          if (attempt++ < 5) {
            console.log('Retrying update for instance ' + id + '. Attempt ' + attempt)
            setTimeout(function () { update(doc, id, attempt) }, 200)
          } else {
            console.log('Error: Data not updated for instance ' + id + '. Attempt ' + attempt + ' _rev ' + newdata._rev)
          }
        } else if (attempt > 0) {
          console.log('Data updated for instance ' + id + '. Attempt ' + attempt)
        }
      })
    }
  })
}

var read = function (id, callback, errorcallback) {
  db.get(id, function (err, data) {
    if (err && errorcallback) {
      errorcallback(err)
    } else {
      callback(data)
    }
  })
}

var findActive = function (callback, errorcallback) {
  db.find(
    {
      'selector': {
        'created': { '$gt': 0 }
      }
    }

    //         {
    //   "selector": {
    //     "deleted": {
    //       "$exists": false
    //     },"space":{"$exists":true}
    //   }
    //     // ,"fields": [
    //     // "space.guid",
    //     // "_id",
    //     // "org.guid", "deleted"
    // //   ]

    // }

    , function (err, data) {
      if (err && errorcallback) {
        errorcallback(err)
      } else {
        callback(data)
      }
    })
}

exports.getPooledInstance = function () {
  var defer = Q.defer()
  var searchquery = { 'selector': { 'mfinstance': { '$exists': false } } }
  db.find(searchquery, function (err, body) {
    if (!err) {
      if (body.docs.length > 0) {
        defer.resolve(body.docs[0])
      } else {
        defer.reject('No instances found')
      }
    } else {
      defer.reject(err)
    }
  })
  return defer.promise
}

exports.initialize = initialize
exports.insert = insert
exports.get = read
exports.update = update
exports.activeinstances = findActive
