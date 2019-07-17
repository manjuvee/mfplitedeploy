/**
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2016. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

var config = require('./config')
var db;
var dbCredentials = {
    dbName: process.env.CLOUDANT_POOL_DBNAME,
    port:443
};

/*Cloudant db initialization for db and uptimedb.
 */
function initDBConnection(callback) {

    if (process.env.CLOUDANT_URL) {
        dbCredentials.url = process.env.CLOUDANT_URL;
    } else {
        dbCredentials.url = "https://c277b75e-c194-4e2d-b250-53f2c5110295-bluemix:305b6bb6652cdbc9fcd8891efe42ac002e051acc330d21ea14364003844b2b4f@c277b75e-c194-4e2d-b250-53f2c5110295-bluemix.cloudant.com";
    }

    var cloudant = require('@cloudant/cloudant')(dbCredentials.url);

    // check if DB exists if not create
    cloudant.db.create(dbCredentials.dbName, function(err, res) {
        if (err && err.error != 'file_exists') {
            log.error('could not create db ', err);
            callback(err);
            return;
        } else if (!err || err.error == 'file_exists') {
            log.info("db will either be created or it already exists.");
            db = cloudant.use(dbCredentials.dbName);

            cloudant.db.create(dbCredentials.containerDBName, function(err, res) {
                if (err && err.error != 'file_exists') {
                    log.error('could not create container details db ', err);
                    callback(err);
                    return;
                } else if (!err || err.error == 'file_exists') {
                    log.info("container details db will either be created or it already exists.");

                    containerDetailsdb = cloudant.use(dbCredentials.containerDBName);
                    callback();
                    return;
                }
            });
        }
    });

}

/*Retrieves config data that is already saved to vault.
 */
module.exports.retrieveConfigDataFromVault = function(id, callback) {
    log.info('config data for instance ID ' + id);
    var er = {};
    if (!id) {
        id = '';
        er.errCode = 6610;
        er.errMsg = "Error while trying to retrieve config data. No Id passed";
        callback(null, er);
        return;
    }
    db.get(id, function(err, body) {
        if (err) {
            if (err.message === 'missing') {
                er.errCode = 6600;
                er.errMsg = "No config data found in db";
                callback({});
                return;
            }
            log.error('Error while retrieving Config data from vault ' + JSON.stringify(err));
            er.errCode = 6600;
            er.err = err;
            er.errMsg = "Error while trying to retrieve config data";
            callback(null, er);
            return;
        } else {
            log.info('Retrieving Config data from vault ' + JSON.stringify(body));
           // body.IsDedicated = process.env.ISDEDICATED;
            // Check if the data was before we started encrypting or after. Decrypt if encrypted.
            if (body.encryptionVersion) {
                var decryptedBody = clone(body);
                decryptedBody.adminPwd = decrypt(body.adminPwd);
                decryptedBody.ltpaKeysPwd = decrypt(body.ltpaKeysPwd);
                if(body.isExternalDB && body.dbcredentials && body.dbcredentials.password ) {
                    decryptedBody.dbcredentials.password = decrypt(body.dbcredentials.password);
                    decryptedBody.dbcredentials.ssldsn = decrypt(body.dbcredentials.ssldsn);
                    decryptedBody.dbcredentials.dsn = decrypt(body.dbcredentials.dsn);
                }
                callback(decryptedBody);
                return;
            }
            callback(body);
            return;
        }
    });
};

/*Persists user service instance id and container details.
 *A new document is created if its the first time the data is getting persisted.
 *Index for all fields are created to help search.
 *If a document already exists, then we update the document with new data.
 *The callback returns the error json[err,errCode,errMsg] incase of error.
 *The callback containes the cloudant doc in case it successfully persists data.
 */
module.exports.persistDataToVault = function(id, data, callback) {
    log.debug("Persisting data to vault. id: " + id + " payload: " + JSON.stringify(data));
    if (!id) {
        id = '';
    }

    // Encrypt pwds before writing to cloudant. New documents: just encrypt.
    // For existing documents, check if its from before we started encrypting.
    var encryptedDbcredentials = '';
    if(data.dbcredentials) {
        encryptedDbcredentials = clone(data.dbcredentials);
    }
    if (data.isExternalDB) {
        encryptedDbcredentials.password = encrypt(data.dbcredentials.password);
        encryptedDbcredentials.ssldsn = encrypt(data.dbcredentials.ssldsn);
        encryptedDbcredentials.dsn = encrypt(data.dbcredentials.dsn);
    }
    var payload = {
        'serviceInstanceId': data.serviceInstanceID,
        'containerId': data.containerId,
        'containerRoute': data.containerRoute,
        'containerType': data.containerType,
        'httpPort': data.httpPort,
        'httpsPort': data.httpsPort,
        'adminPwd': encrypt(data.adminPwd),
        'spaceGUID': data.spaceGuid,
        'accessToken': data.accessToken,
        'database': data.database,
        'plan': data.plan,
        'NumberInstances': data.NumberInstances,
        'userRegistryConfig': data.userRegistryConfig,
        'jndiConfig': data.jndiConfig,
        'ltpaKeysPwd': encrypt(data.LTPAKeysPwd),
        'isAPerCapacityPlan': data.isAPerCapacityPlan,
        'dbcredentials' : encryptedDbcredentials,
        'isExternalDB' : data.isExternalDB,
        'encryptionVersion': encryptionVersion,
        'dashDBServiceGuid': data.dashDBServiceGuid,
        'dbdata': data.dbdata
    };
    if(data.keystorepassword && data.keystorefilename){
        payload.keystorepassword = data.keystorepassword;
        payload.keystorefilename = data.keystorefilename;
    }
    if(data.truststorepassword && data.truststorefilename){
        payload.truststorepassword = data.truststorepassword;
        payload.truststorefilename = data.truststorefilename;
    }

    db.find({
        "selector": {
            "_id": data.serviceInstanceId
        }
    }, function(err, body) {
        if (!err) {
            if (body.docs.length === 0) {
                //No record found with the serviceInstanceId. Insert document
                db.insert(payload, id, function(err, doc) {
                    if (err) {
                        var er = {};
                        log.error("Error in persisting service and container data to user's database" + err);
                        er.err = err;
                        er.errCode = 6050;
                        er.errMsg = "Error in persisting serivce and container data to db";
                        callback(null, er);
                        return;
                    } else {
                        log.info("Created doc with service instance id and container info");
                        callback(doc);
                        return;
                    }
                });
            } else {
                //Existing record for the serviceInstanceId. Will update the document with new data.
                console.log("revision of the existing doc : " + body.docs[0]._rev);
                payload._rev = body.docs[0]._rev;
                payload._id = body.docs[0]._id;
                if (body.docs[0]._attachments) {
                    payload._attachments = body.docs[0]._attachments;
                }
                payload.serviceInstanceId = data.serviceInstanceID || body.docs[0].serviceInstanceId;
                payload.containerId = data.containerId || body.docs[0].containerId;
                payload.containerRoute = data.containerRoute || body.docs[0].containerRoute;
                payload.containerType = data.containerType || body.docs[0].containerType;
                payload.httpPort = data.httpPort || body.docs[0].httpPort;
                payload.httpsPort = data.httpsPort || body.docs[0].httpsPort;
                if(body.docs[0].encryptionVersion) {
                    // data in cloudant is already encrypted. Just encrypt new data coming in.
                    payload.adminPwd = encrypt(data.adminPwd) || body.docs[0].adminPwd;
                    payload.ltpaKeysPwd = encrypt(data.LTPAKeysPwd) || body.docs[0].LTPAKeysPwd;
                    payload.dbcredentials = encryptedDbcredentials || body.docs[0].dbcredentials;
                } else {
                    // this json entry in cloudant was created before encrypting. Encrypt this time also add the flag.
                    payload.adminPwd = encrypt(data.adminPwd) || encrypt(body.docs[0].adminPwd);
                    payload.ltpaKeysPwd = encrypt(data.LTPAKeysPwd) || encrypt(body.docs[0].LTPAKeysPwd);

                    if(body.docs[0].isExternalDB && body.docs[0].dbcredentials) {
                        var encryptedOldDbcredentials = clone(body.docs[0].dbcredentials);
                        encryptedOldDbcredentials.password = encrypt(body.docs[0].dbcredentials.password);
                        encryptedOldDbcredentials.ssldsn = encrypt(body.docs[0].dbcredentials.ssldsn);
                        encryptedOldDbcredentials.dsn = encrypt(body.docs[0].dbcredentials.dsn);
                        payload.dbcredentials = encryptedDbcredentials || encryptedOldDbcredentials;
                    }
                   
                    payload.encryptionVersion = encryptionVersion;
                }
                if(body.docs[0].keystorepassword && body.docs[0].keystorefilename)
                {
                    payload.keystorepassword = data.keystorepassword || body.docs[0].keystorepassword;
                    payload.keystorefilename = data.keystorefilename || body.docs[0].keystorefilename;
                }
                if(body.docs[0].truststorepassword && body.docs[0].truststorefilename)
                {
                    payload.truststorepassword = data.truststorepassword || body.docs[0].truststorepassword;
                    payload.truststorefilename = data.truststorefilename || body.docs[0].truststorefilename;
                }
                payload.spaceGUID = data.spaceGuid || body.docs[0].spaceGuid;
                payload.accessToken = data.accessToken || body.docs[0].accessToken;
                payload.database = data.database || body.docs[0].database;
                payload.plan = data.plan || body.docs[0].plan;
                payload.NumberInstances = data.NumberInstances || body.docs[0].NumberInstances;
                payload.userRegistryConfig = data.userRegistryConfig || body.docs[0].userRegistryConfig;
                payload.jndiConfig = data.jndiConfig || body.docs[0].jndiConfig;
                payload.isExternalDB = data.isExternalDB || body.docs[0].isExternalDB;
                payload.isAPerCapacityPlan = data.isAPerCapacityPlan || body.docs[0].isAPerCapacityPlan;
                payload.dashDBServiceGuid = data.dashDBServiceGuid || body.docs[0].dashDBServiceGuid;
                payload.dbdata = data.dbdata || body.docs[0].dbdata;

                db.insert(payload, function(err, doc) {
                    if (err) {
                        var er = {};
                        log.error("Error in persisting data to user's database" + err);
                        er.err = err;
                        er.errCode = 6050;
                        er.errMsg = "Error in persisting serivce and container data to db";
                        callback(null, er);
                        return;
                    }
                    log.info("Updated doc with service instance id and container info");
                    callback(doc);
                    return;
                });
            }
        } else {
            log.error(
                "Error in searching for serviceInstanceId" + err);
            log.info(
                "Most probably there is no index for fields. So, adding the data to cloudant and re-create index for all fileds"
            );
            // create a new record
            db.insert(payload, id, function(err, doc) {
                if (err) {
                    var er = {};
                    log.error("Error in persisting data to user's database" + err);
                    er.err = err;
                    er.errCode = 6050;
                    er.errMsg = "Error in persisting serivce and container data to db";
                    callback(null, er);
                    return;
                } else {
                    log.info(
                        "Created fresh doc with service instance id and container info");
                    createVaultDBIndex();
                    callback(doc);
                    return;
                }
            });
        }
    });

};

