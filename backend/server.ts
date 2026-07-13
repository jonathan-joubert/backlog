import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

const app = express();
app.use(cors());
app.use(express.json());

const SAPS_URL = 'https://www.saps.gov.za/services/firearm_status_enquiry.php';

// Ignores the broken SSL certificate chain from the SAPS server
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Standard browser headers to prevent basic firewall blocks
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

app.get('/', (req, res) => {
  res.send('✅ SAPS Proxy Server is running! Use your React frontend to interact with this API.');
});

// Endpoint 1: Check if the specific SAPS URL is up
app.get('/api/healthcheck', async (req, res) => {
  try {
    const response = await axios.get(SAPS_URL, { headers: BROWSER_HEADERS, timeout: 10000, httpsAgent });
    res.json({ isUp: response.status === 200 });
  } catch (error) {
    res.json({ isUp: false });
  }
});

// Endpoint 2: Fetch Firearm Status
app.post('/api/check-status', async (req, res) => {
  const { fsref, fserial } = req.body;

  if (!fsref || !fserial) {
    return res.status(400).json({ error: "Reference and Serial numbers are required" });
  }

  try {
    // Step 1: GET request to initialize session and grab cookies
    const getResponse = await axios.get(SAPS_URL, { headers: BROWSER_HEADERS, httpsAgent });
    
    // Properly format cookies (strip out 'expires', 'path', etc. keep only key=value)
    const rawCookies = getResponse.headers['set-cookie'] || [];
    const formattedCookies = rawCookies.map(cookie => cookie.split(';')[0]).join('; ');

    // Extract the CSRF token directly from the cookie string
    let csrfToken = '';
    const csrfMatch = formattedCookies.match(/csrf_token=([^;]+)/);
    if (csrfMatch) {
      csrfToken = csrfMatch[1];
    } else {
      // Fallback in case it's in the DOM
      const $get = cheerio.load(getResponse.data);
      csrfToken = $get('input[name="csrf_token"]').val() as string || '';
    }

    // Step 2: Prepare the exact form data
    const params = new URLSearchParams();
    params.append('csrf_token', csrfToken);
    params.append('fsref', fsref);
    params.append('fserial', fserial);

    // Step 3: POST the data with the cleaned session cookies
    const postResponse = await axios.post(SAPS_URL + '#result', params, {
      httpsAgent,
      headers: {
        ...BROWSER_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': formattedCookies
      }
    });

    // Step 4: Parse the response HTML
    const $ = cheerio.load(postResponse.data);
    const rowCells = $('table.table-bordered tbody tr.active td');

    // If no row is found, it means the search failed or details were wrong
    if (rowCells.length === 0) {
      return res.status(404).json({ error: "No status found. Please check your Reference and Serial numbers." });
    }

    const result = {
      applicationType: $(rowCells[0]).text().trim(),
      applicationNumber: $(rowCells[1]).text().trim(),
      calibre: $(rowCells[2]).text().trim(),
      make: $(rowCells[3]).text().trim(),
      serialNumber: $(rowCells[4]).text().trim(),
      statusDate: $(rowCells[5]).text().trim(),
      status: $(rowCells[6]).text().trim(),
      statusDescription: $(rowCells[7]).text().trim(),
      nextStep: $(rowCells[8]).text().trim(),
    };

    res.json(result);

  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({ error: "Failed to communicate with SAPS server." });
  }
});

app.listen(3001, () => {
  console.log('Proxy running on http://localhost:3001');
});
