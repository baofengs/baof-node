
const qrImage = require('qr-image');

function generate({url, color, bg}) {
    return new Promise((resolve, reject) => {
        if (!url) {
            return reject(new Error('链接不对啊小伙子'));
        }

        const data = qrImage.imageSync(url, {
            type: 'svg'
        });
        let svgPathStr = data.toString();

        if (color) {
            svgPathStr = svgPathStr.replace(/<path/, `<path fill="${color}"`);
        }

        if (bg) {
            svgPathStr = svgPathStr.replace(/<svg/, `<svg style="background: ${bg};"`);
        }

        const svgHead = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
        resolve(`${svgHead}${svgPathStr}`);
    });
}

module.exports = async (req, res) => {
    const qr = await generate(req.query);
    res.setHeader('content-type', 'image/svg+xml; charset=utf-8');
    res.send(qr);
}
