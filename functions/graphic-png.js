const path = require('path');
const fs = require('fs');

exports.handler = async (event) => {
  const { file } = event.queryStringParameters || {};
  if (!file || !/^[a-z0-9_]+-\d{4}-\d{2}-\d{2}$/.test(file)) {
    return { statusCode: 400, body: 'Invalid file parameter' };
  }

  const htmlPath = path.join(process.cwd(), 'graphics', `${file}.html`);
  if (!fs.existsSync(htmlPath)) {
    return { statusCode: 404, body: 'Graphic not found' };
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');
  const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/);
  if (!svgMatch) {
    return { statusCode: 500, body: 'SVG not found in file' };
  }

  try {
    const { Resvg } = require('@resvg/resvg-js');
    const resvg = new Resvg(svgMatch[0], { fitTo: { mode: 'width', value: 1200 } });
    const png = resvg.render().asPng();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
      body: Buffer.from(png).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: `PNG render failed: ${err.message}` };
  }
};
