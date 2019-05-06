const AWS = require('aws-sdk')
const fs = require('fs')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname

const BUCKET = process.env.BUCKET
const s3 = new AWS.S3()

const writeFile = (file, content) => {
    return new Promise((resolve, reject) => {
        mkdirp(getDirName(file), function(err) {
            if (err) {
                reject(err)
            } else {
                fs.writeFile(file, content, err => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(true)
                    }
                })
            }
        })
    })
}

/**
 * Download file from s3 to tmp direcotry
 * @param {string} key to s3 file
 */

exports.downloadFile = async (key, filePath) => {
    try {
        console.log(`Getting file: b: ${BUCKET} k: ${key}`)
        let data = await s3
            .getObject({
                Bucket: BUCKET,
                Key: key
            })
            .promise()

        let ok = await writeFile(filePath, data.Body)
        console.log(`${filePath} has been created successfully: ${ok}`)
        return filePath
    } catch (e) {
        console.log(e)
        console.log('error getting file from s3: ', key, JSON.stringify(e))
        return undefined
    }
}

/**
 * Upload / save file to s3
 * @param {string} key to s3 file
 * @param {string} filePath to file to upload
 */
exports.uploadFile = async (key, filePath, metadata) => {
    try {
        console.log(`reading file: ${filePath}`)
        let data = await fs.readFileSync(filePath)

        //var base64data = new Buffer(data, 'binary')
        console.log(`got base64 data and going to upload to key: ${key}`)
        let resp = await s3
            .upload({
                Bucket: BUCKET,
                Key: key,
                Body: data,
                Metadata: metadata || {}
            })
            .promise()
        console.log(`returning OK: ${resp}`)
        return true
    } catch (e) {
        console.log(e)
        console.log('error saving file to s3: ', key, JSON.stringify(e))
        return false
    }
}
