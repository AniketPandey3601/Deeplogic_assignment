const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const https = require('https');

const PORT = 3000;


async function getData(url) {
  const options = new URL(url);

  return new Promise((resolve, reject) => {
    https.get(options, (res) => {
      let data = '';

      if (res.statusCode === 200) {
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      } else {
        reject(new Error(`Request Failed. Status Code: ${res.statusCode}`));
      }
    }).on('error', (err) => reject(err));
  });
}


function extractTopNews(html) {
  const itemRegex = /<a class="tout__list-item-link" href="([^"]+)">[\s\S]*?<h3 class="tout__list-item-title">([^<]+)<\/h3>/g;

  let match;
  const topNews = [];

  while ((match = itemRegex.exec(html)) !== null) {
    const link = match[1];
    const headline = match[2].trim();
    topNews.push({ headline, link });

    if (topNews.length >= 6) break;
  }

  return topNews;
}


const server = http.createServer(async (req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    try {
      const url = 'https://time.com/';
      const data = await getData(url);
      const topNews = extractTopNews(data);

      let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Top News</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              
              .news-item { margin-bottom: 15px; }
              .news-item a { text-decoration: none;  }
              .news-item a:hover { text-decoration: underline; }
          </style>
      </head>
      <body>
          <h1>Top 6 News Headlines</h1>
          <ul>
      `;

      topNews.forEach((news, index) => {
        html += `
          <li class="news-item">
              <a href="https://time.com${news.link}" target="_blank">${news.headline}</a>
          </li>
        `;
      });

      html += `
          </ul>
      </body>
      </html>
      `;

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error: ${err.message}`);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});


server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
