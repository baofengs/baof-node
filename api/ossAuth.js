
const crypto = require('crypto');
const Core = require('@alicloud/pop-core');
const { OSS_HOST, SOURCE_TYPES } = require('../config/index');

const MAX_SIZE_OF_FILE = 200 * 1024 * 1024;
const STS_EXPIRATION = 300000;

const getSts = () => {
    return new Promise((resolve, reject) => {
        const { BAO_ACCESS_ID, BAO_ACCESS_SECRET } = process.env;

        const client = new Core({
            accessKeyId: BAO_ACCESS_ID,
            accessKeySecret: BAO_ACCESS_SECRET,
            endpoint: 'https://sts.aliyuncs.com',
            apiVersion: '2015-04-01'
        });

        client.request('AssumeRole', {
            'RoleArn': 'acs:ram::1228754401881165:role/ossadmain',
            'RoleSessionName': 'bao'
        }).then(authData => {
            sts = authData;
            resolve([null, authData]);
        }).catch(error => {
            reject([error, null]);
        });
    });
}

function getBucketBy(type) {
    let bucket = 'images/';
    const { image, audio, video } = SOURCE_TYPES;
    switch (+type) {
        case image.id:
            bucket = image.bucket;
            break;
        case audio.id:
            bucket = audio.bucket;
            break;
        case video.id:
            bucket = video.bucket;
            break;
        default:
            bucket = 'images/';
    }
    return bucket;
}

const sign = ({ AccessKeyId, AccessKeySecret }, bucket) => {
    const expire = new Date().getTime() + STS_EXPIRATION;
    const policyString = JSON.stringify({
        expiration: new Date(expire).toISOString(),
        conditions: [
            ['content-length-range', 0, MAX_SIZE_OF_FILE],
            ['starts-with', '$key', bucket]
        ]
    });
    const policy = new Buffer(policyString).toString('base64');
    const signature = crypto.createHmac('sha1', AccessKeySecret).update(policy).digest('base64');
    return {
        expire,
        policy,
        signature,
        AccessKeyId
    };
};

const getPolicy = async (type) => {
    const [error, sts] = await getSts();
    if (error) {
        return [error, null];
    }
    const Credentials = sts.Credentials;
    const bucket = getBucketBy(type);
    const { expire, policy, signature, AccessKeyId } = sign(Credentials, bucket);
    return [null, {
        bucket,
        expire,
        policy,
        signature,
        accessId: AccessKeyId,
        success_action_status: '200',
        'x-oss-security-token': sts.Credentials.SecurityToken,
        url: OSS_HOST,
    }];
};

module.exports = async (req, res) => {
    const type = req.query && req.query.type || req.body && req.body['type'] || 1;
    const [error, policy] = await getPolicy(type);
    if (error) {
        res.code(500).send(error.toString());
    }
    res.json({
        code: 0,
        msg: 'success',
        data: policy
    });
}
