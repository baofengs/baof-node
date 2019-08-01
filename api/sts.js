
const Core = require('@alicloud/pop-core');

module.exports = (req, res) => {
    const { BAO_ACCESS_ID, BAO_ACCESS_SECRET } = process.env;
    const client = new Core({
        accessKeyId: BAO_ACCESS_ID,
        accessKeySecret: BAO_ACCESS_SECRET,
        endpoint: 'https://sts.aliyuncs.com',
        apiVersion: '2015-04-01'
    });

    const params = {
        'RoleArn': 'acs:ram::1228754401881165:role/ossadmain',
        'RoleSessionName': 'bao'
    }

    client.request('AssumeRole', params).then(authData => {
        res.json({
            code: 0,
            msg: 'success',
            data: authData
        });
    }).catch(error => {
        res.status(500).send(error.toString());
    });
};
