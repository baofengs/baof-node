
const crypto = require('crypto');
const Core = require('@alicloud/pop-core');
const { OSS_CDN, OSS_END_POINT, OSS_BUCKET } = require('../config/index');

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

const sign = (AccessKeySecret, bucket) => {
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
        signature
    };
};

const getPolicy = async () => {
    const [error, sts] = await getSts();
    if (error) {
        return [error, null];
    }
    const Credentials = sts.Credentials;
    const { AccessKeyId, AccessKeySecret, SecurityToken } = Credentials;
    const { expire, policy, signature } = sign(AccessKeySecret, OSS_BUCKET);
    return [null, {
        expire,
        policy,
        signature,
        accessId: AccessKeyId,
        accessSecret: AccessKeySecret,
        success_action_status: '200',
        securityToken: SecurityToken,
        endpoint: OSS_END_POINT,
        bucket: OSS_BUCKET,
        cdnUrl: OSS_CDN
    }];
};

module.exports = async (req, res) => {
    const [error, policy] = await getPolicy();
    if (error) {
        res.code(500).send(error.toString());
        return;
    }
    res.json({
        code: 0,
        msg: 'success',
        data: policy
    });
}
