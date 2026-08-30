const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const projectRoot = path.resolve(__dirname, '..');
const buildDirectory = path.join(projectRoot, 'build');
const sourceTemplatePath = path.join(buildDirectory, 'index.html');
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'datalab-prerender-'));
const serverBundlePath = path.join(temporaryDirectory, 'renderer.cjs');

const escapeAttribute = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const replaceTag = (html, pattern, replacement, label) => {
  if (!pattern.test(html)) throw new Error(`Missing ${label} in the production HTML template`);
  return html.replace(pattern, replacement);
};

const addMetadata = (template, metadata) => {
  const title = escapeAttribute(metadata.title);
  const description = escapeAttribute(metadata.description);
  const canonical = escapeAttribute(metadata.canonical);
  const image = escapeAttribute(metadata.image);
  let html = template;

  html = replaceTag(html, /<title>.*?<\/title>/i, `<title>${title}</title>`, 'title');
  html = replaceTag(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${description}"/>`, 'meta description');
  html = replaceTag(html, /<meta\s+name="robots"\s+content="[^"]*"\s*\/?\s*>/i, '<meta name="robots" content="index,follow"/>', 'robots meta');
  html = replaceTag(html, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?\s*>/i, `<link rel="canonical" href="${canonical}"/>`, 'canonical');
  html = replaceTag(html, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?\s*>/i, `<meta property="og:url" content="${canonical}"/>`, 'Open Graph URL');
  html = replaceTag(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?\s*>/i, `<meta property="og:title" content="${title}"/>`, 'Open Graph title');
  html = replaceTag(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?\s*>/i, `<meta property="og:description" content="${description}"/>`, 'Open Graph description');
  html = replaceTag(html, /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image" content="${image}"/>`, 'Open Graph image');

  if (metadata.structuredData) {
    const jsonLd = JSON.stringify(metadata.structuredData).replaceAll('<', '\\u003c');
    html = html.replace('</head>', `<script type="application/ld+json">${jsonLd}</script></head>`);
  }

  return html;
};

try {
  if (!fs.existsSync(sourceTemplatePath)) {
    throw new Error('Missing build/index.html. Run the React build before prerendering.');
  }

  buildSync({
    entryPoints: [path.join(projectRoot, 'src', 'prerender-entry.jsx')],
    outfile: serverBundlePath,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    logLevel: 'warning',
    loader: {
      '.js': 'jsx',
      '.css': 'empty',
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.jpeg': 'dataurl',
      '.svg': 'dataurl'
    }
  });

  const { PUBLIC_ROUTES, metadataForRoute, renderRoute } = require(serverBundlePath);
  const baseTemplate = fs.readFileSync(sourceTemplatePath, 'utf8');
  const uniqueTitles = new Set();
  const uniqueDescriptions = new Set();
  const uniqueCanonicals = new Set();

  for (const route of PUBLIC_ROUTES) {
    const metadata = metadataForRoute(route);
    const renderedContent = renderRoute(route);
    if (uniqueTitles.has(metadata.title)) throw new Error(`Duplicate SEO title for ${route}`);
    if (uniqueDescriptions.has(metadata.description)) throw new Error(`Duplicate meta description for ${route}`);
    if (uniqueCanonicals.has(metadata.canonical)) throw new Error(`Duplicate canonical URL for ${route}`);
    if (!/<h1(?:\s|>)/i.test(renderedContent)) throw new Error(`Missing prerendered H1 for ${route}`);
    if (renderedContent.length < 500) throw new Error(`Prerendered content is unexpectedly short for ${route}`);
    uniqueTitles.add(metadata.title);
    uniqueDescriptions.add(metadata.description);
    uniqueCanonicals.add(metadata.canonical);
    let html = addMetadata(baseTemplate, metadata);
    html = replaceTag(
      html,
      /<div\s+id="root"\s*><\/div>/i,
      `<div id="root">${renderedContent}</div>`,
      'React root container'
    );
    html = html.replace('<body>', `<body><!-- prerendered-route:${route} -->`);

    const outputPath = route === '/'
      ? sourceTemplatePath
      : path.join(buildDirectory, `${route.replace(/^\//, '')}.html`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`Prerendered ${route} -> ${path.relative(projectRoot, outputPath)}`);
  }
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
