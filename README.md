# node-red-contrib-google-spreadsheet-plus

A Node-RED module for Google Sheets integration with smart caching, data transformations, and modern authentication. Read, write, update, append, and clear data in Google Sheets with automatic data format conversion and built-in validation.

**Compatible with Node-RED v3.0.0 and above** | **Built-in JWT authentication** | **Smart caching** | **Zero configuration data transformations**

## Table of Contents

- [Overview](#overview)
- [Why Use This Package](#why-use-this-package)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Data Transformations](#data-transformations)
- [Caching](#caching)
- [Security](#security)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)

## Overview

This module provides a complete solution for working with Google Sheets in Node-RED. Instead of dealing with complex authentication flows, A1 notation parsing, and data format conversions, you get a simple, intuitive interface that handles all the heavy lifting.

**How to Use:**

1. **Set up once** - Configure a Google Service Account in your Google Cloud Console
2. **Connect** - Add a Service Account config node in Node-RED with your credentials
3. **Use anywhere** - Place Google Sheets nodes in your flows to read/write data

**What you can do:**

- **Read data** from any range in any format (2D arrays, objects, with/without headers)
- **Write data** to specific ranges (append new rows, update existing cells, or clear first)
- **Append rows** to the end of existing data without overwriting
- **Clear ranges** to remove unwanted data
- **Cache results** for better performance on repeated reads
- **Transform data** automatically between arrays, objects, and Google Sheets format

**How it works:**

Google Sheets stores data in a grid (rows and columns). This module lets you:
1. **Specify a location** using A1 notation (e.g., `Sheet1!A1:D10` means columns A through D, rows 1 through 10)
2. **Choose an operation** (get data, set data, or clear data)
3. **Send/receive data** in the format that works best for your flow

The module handles all the complexity:
- Converts your data to Google Sheets format automatically
- Manages authentication tokens with automatic refresh
- Caches data to reduce API calls
- Validates all inputs before making API requests
- Provides clear error messages when something goes wrong

**Authentication:**

Uses Google Service Accounts with JWT (JSON Web Token) authentication. This is the most secure method for server-to-server communication and doesn't require user interaction or OAuth consent screens.

All credentials are encrypted using Node-RED's built-in encryption and stored in `flows_cred.json`. Sensitive data never appears in plain text in your flows.

## Why Use This Package

### vs. Manual API Calls

- **10x Less Code**: What takes 50+ lines of code becomes a single node
- **Built-in Validation**: Catches errors before API calls
- **Automatic Retries**: Handles token refresh and transient errors
- **Smart Caching**: Reduces API calls by up to 90%

### vs. Other Packages

- **Modern**: Uses latest googleapis (170.1.0), async/await, ES6+
- **Production-Ready**: Comprehensive error handling, validation, and status indicators
- **Well-Tested**: 100% coverage on business logic (328 passing tests)
- **Active Maintenance**: Regular updates, security patches, and feature additions

### Key Benefits

- **Simple Configuration**: Copy-paste JSON credentials, start working in seconds
- **Flexible Data Handling**: Works with arrays, objects, primitives - converts automatically
- **Clear Error Messages**: Know exactly what went wrong and how to fix it
- **Visual Feedback**: Node status shows current operation state
- **No External Dependencies**: Only depends on googleapis (official Google library)

## Installation

### Via Palette Manager (Recommended)

1. Open Node-RED editor
2. Go to Menu → Manage palette → Install tab
3. Search for `node-red-contrib-google-spreadsheet-plus`
4. Click Install

### Via npm

Install in your Node-RED user directory (typically `~/.node-red`):

```bash
cd ~/.node-red
npm install node-red-contrib-google-spreadsheet-plus
```

**Important:** Restart Node-RED after npm installation to load the nodes.

### Requirements

- Node-RED v3.0.0 or higher
- Node.js v20.0.0 or higher
- Google Cloud Project with Sheets API enabled
- Google Service Account with spreadsheet access

The nodes will appear in the palette:
- **google-service-account** (configuration node, accessible via any Google Sheets node)
- **google-spreadsheet** in the storage category with a Sheets icon

## Quick Start

### 1. Set Up Google Cloud Credentials

<details>
<summary><b>Step-by-step instructions</b> (click to expand)</summary>

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Click "Select a project" → "New Project"
   - Enter project name, click "Create"

2. **Enable Google Sheets API**
   - In your project, go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click on it, then click "Enable"

3. **Create Service Account**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Fill in:
     - Service account name: `node-red-sheets` (or any name)
     - Service account ID: (auto-filled)
   - Click "Create and Continue"
   - Skip the optional steps, click "Done"

4. **Generate Key**
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Click "Create"
   - A JSON file will download - keep this safe!

5. **Share Your Spreadsheet**
   - Open your Google Spreadsheet
   - Click "Share" button
   - Add the service account email (looks like `name@project.iam.gserviceaccount.com`)
   - Grant **Editor** permission (for write access) or **Viewer** (for read-only)
   - Click "Done"

**⚠️ Important:** Without sharing, you'll get "Permission denied" errors!

</details>

### 2. Configure in Node-RED

<details>
<summary><b>Configuration steps</b> (click to expand)</summary>

1. **Add Service Account Config Node**
   - Drag a "Google Sheets" node into your flow
   - Double-click to open settings
   - Click pencil icon next to "Credentials" to create new config
   - Name it (e.g., "Production Service Account")

2. **Add Credentials**
   - Select "Copy/paste JSON" (recommended)
   - Open the downloaded JSON file
   - Copy entire contents
   - Paste into the "Credentials JSON" field
   - Click "Add"

   *Alternative: Enter fields individually (project_id, client_email, private_key)*

3. **Configure Spreadsheet Node**
   - **Spreadsheet ID**: Copy from URL between `/d/` and `/edit`
     ```
     https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                              ↑ This is your Spreadsheet ID ↑
     ```
   - **Range**: Use A1 notation (e.g., `Sheet1!A1:D10`)
   - **Action**: Choose "Get Data", "Set Data", or "Clear Data"
   - **Output**: Where to store results (default: `msg.payload`)

4. **Deploy and Test**
   - Click "Deploy"
   - Inject a message (using an inject node)
   - Check the debug output

</details>

### 3. Your First Flow

<details>
<summary><b>Example: Read data from a spreadsheet</b> (click to expand)</summary>

```
[inject] → [Google Sheets] → [debug]
```

**Inject node configuration:**
```json
{
  "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "range": "Sheet1!A1:C10"
}
```

**Google Sheets node configuration:**
- Action: "Get Data"
- Sheet ID: from `msg.spreadsheetId`
- Range: from `msg.range`
- Output: `msg.payload`

**Result in msg.payload:**
```json
[
  ["Name", "Email", "Age"],
  ["John Doe", "john@example.com", 30],
  ["Jane Smith", "jane@example.com", 25]
]
```

**With "First line for labels" enabled:**
```json
[
  { "Name": "John Doe", "Email": "john@example.com", "Age": 30 },
  { "Name": "Jane Smith", "Email": "jane@example.com", "Age": 25 }
]
```

</details>

## Usage

### Reading Data

<details>
<summary><b>Get Data - Basic Examples</b> (click to expand)</summary>

**Read entire sheet:**
```
Range: Sheet1
Output: 2D array of all data
```

**Read specific range:**
```
Range: Sheet1!A1:D10
Output: [[row1], [row2], ...]
```

**Read with column headers:**
```
Range: Sheet1!A1:C10
Enable: "First line for labels"
Output: [{Name: "John", Age: 30}, ...]
```

**Read with row and column headers:**
```
Range: Sheet1!A1:D5
Enable: "First line for labels" + "First column for labels"
Output: {John: {Age: 30, City: "NYC"}, ...}
```

**Read single column:**
```
Range: Sheet1!B:B
Output: [["value1"], ["value2"], ...]
```

**Read single row:**
```
Range: Sheet1!1:1
Output: [["col1", "col2", "col3"]]
```

</details>

<details>
<summary><b>Get Data - Advanced Options</b> (click to expand)</summary>

**Select specific fields only:**
```
Data: [{Name: "John", Age: 30, City: "NYC", Country: "USA"}]
Selected fields: ["Name", "Age"]
Output: [{Name: "John", Age: 30}]
```

**Get by column (transpose):**
```
Enable: "Get data by column"
Input data (rows):
  [["Name", "Age"], ["John", 30], ["Jane", 25]]
Output (columns):
  [["Name", "John", "Jane"], ["Age", 30, 25]]
```

**Caching for performance:**
```
Cache location: msg._sheet (default)
First read: Calls API
Second read: Uses cached data (instant)
Clear cache: Use "Clear Data" action or delete msg._sheet
```

</details>

### Writing Data

<details>
<summary><b>Set Data - Write Methods</b> (click to expand)</summary>

**Update (modify existing cells):**
```
Method: Update
Range: Sheet1!A2:C3
Input: [["John", 30, "NYC"], ["Jane", 25, "LA"]]
Result: Updates only cells A2:C3, leaves other cells unchanged
```

**Append (add rows at the end):**
```
Method: Append
Range: Sheet1!A:C
Input: [["New Person", 35, "SF"], ["Another", 40, "SEA"]]
Result: Adds rows after last existing row
```

**New (clear then write):**
```
Method: New
Range: Sheet1!A1:C10
Input: [["Header1", "Header2", "Header3"], ["Data1", "Data2", "Data3"]]
Result: Clears A1:C10 first, then writes new data
```

</details>

<details>
<summary><b>Set Data - Input Formats</b> (click to expand)</summary>

**Array of arrays (standard format):**
```json
{
  "payload": [
    ["Name", "Age", "City"],
    ["John", 30, "NYC"],
    ["Jane", 25, "LA"]
  ]
}
```

**Array of objects (auto-converted):**
```json
{
  "payload": [
    {"Name": "John", "Age": 30, "City": "NYC"},
    {"Name": "Jane", "Age": 25, "City": "LA"}
  ]
}
```

With "First line for labels" enabled, keys become column headers automatically.

**Single value (writes to one cell):**
```json
{
  "payload": "Hello World"
}
```

**Single row:**
```json
{
  "payload": ["Value1", "Value2", "Value3"]
}
```

</details>

### Clearing Data

<details>
<summary><b>Clear Data Examples</b> (click to expand)</summary>

**Clear specific range:**
```
Action: Clear Data
Range: Sheet1!A2:C10
Result: Clears all data in cells A2 through C10
```

**Clear entire sheet:**
```
Range: Sheet1
Result: Clears all data in Sheet1
```

**Clear specific columns:**
```
Range: Sheet1!B:D
Result: Clears columns B, C, D entirely
```

**Note:** Clearing data automatically clears the cache for that range.

</details>

### Dynamic Configuration

<details>
<summary><b>Using msg properties for configuration</b> (click to expand)</summary>

Instead of hardcoding values in the node, pass them via the message:

**Dynamic Spreadsheet ID and Range:**
```javascript
// In a function node or inject
msg.spreadsheetId = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms";
msg.range = "Sheet1!A1:C10";
return msg;
```

Then in Google Sheets node:
- Spreadsheet ID: `msg.spreadsheetId`
- Range: `msg.range`

**Dynamic data input:**
```javascript
msg.payload = [
  ["Product", "Price", "Stock"],
  ["Item A", 29.99, 100],
  ["Item B", 49.99, 50]
];
return msg;
```

**Using global context for shared configuration:**
```javascript
// Set once in a setup flow
global.set("prodSpreadsheetId", "1BxiMVs...");

// Use in multiple flows
msg.spreadsheetId = global.get("prodSpreadsheetId");
```

</details>

## Data Transformations

### Automatic Format Conversion

<details>
<summary><b>Understanding data transformation</b> (click to expand)</summary>

The node automatically converts between formats:

**JavaScript → Google Sheets:**
```javascript
// Array of arrays → Writes directly
[["A1", "B1"], ["A2", "B2"]]

// Array of objects → Converts to 2D array
[{Name: "John", Age: 30}]
→ [["John", 30]]

// Single value → Wraps in array
"Hello"
→ [["Hello"]]

// Empty array → Clears range
[]
```

**Google Sheets → JavaScript:**
```javascript
// No labels → Returns 2D array
[["A1", "B1"], ["A2", "B2"]]

// With "First line for labels" → Returns array of objects
[{Name: "John", Age: 30}, {Name: "Jane", Age: 25}]

// With both labels → Returns nested object
{John: {Age: 30, City: "NYC"}, Jane: {Age: 25, City: "LA"}}

// Single cell → Returns value directly
"Hello"
```

</details>

### Header Handling

<details>
<summary><b>Working with headers</b> (click to expand)</summary>

**Writing with headers:**

```javascript
// Enable "First line for labels" in node
msg.payload = [
  {Product: "Widget", Price: 10, Stock: 100},
  {Product: "Gadget", Price: 20, Stock: 50}
];

// Writes:
// Row 1: Product | Price | Stock
// Row 2: Widget  | 10    | 100
// Row 3: Gadget  | 20    | 50
```

**Reading with headers:**

```
Spreadsheet:
| Name  | Age | City |
|-------|-----|------|
| John  | 30  | NYC  |
| Jane  | 25  | LA   |

Enable "First line for labels"

Output:
[
  {Name: "John", Age: 30, City: "NYC"},
  {Name: "Jane", Age: 25, City: "LA"}
]
```

**Both row and column headers:**

```
Spreadsheet:
|       | Age | City |
|-------|-----|------|
| John  | 30  | NYC  |
| Jane  | 25  | LA   |

Enable both label options

Output:
{
  John: {Age: 30, City: "NYC"},
  Jane: {Age: 25, City: "LA"}
}
```

</details>

### Field Selection

<details>
<summary><b>Extract only specific fields</b> (click to expand)</summary>

When reading objects with many fields, select only what you need:

**Input data:**
```json
[
  {
    "Name": "John",
    "Email": "john@example.com",
    "Phone": "555-1234",
    "Address": "123 Main St",
    "City": "NYC",
    "State": "NY",
    "Zip": "10001"
  }
]
```

**Configuration:**
- Fields to select: `Name, Email, City`

**Output:**
```json
[
  {
    "Name": "John",
    "Email": "john@example.com",
    "City": "NYC"
  }
]
```

**Benefits:**
- Reduces data transfer
- Simplifies downstream processing
- Improves performance

</details>

## Caching

### How Caching Works

<details>
<summary><b>Understanding the cache system</b> (click to expand)</summary>

**Automatic caching:**

1. First read from a range → API call, result cached
2. Second read from same range → Instant return from cache
3. Write to that range → Cache automatically cleared
4. Clear data action → Cache cleared

**Cache storage locations:**
- `msg._sheet` (default) - Cached per message
- `flow._sheet` - Shared across all nodes in same flow
- `global._sheet` - Shared across all flows

**What gets cached:**
- Raw data from Google Sheets API
- Transformed data (if applicable)
- Timestamp of last fetch

**Cache invalidation:**
- Automatic on write/clear operations
- Manual via deleting the cache property
- Time-based (optional, via change node)

</details>

### Cache Configuration

<details>
<summary><b>Configuring cache behavior</b> (click to expand)</summary>

**Per-message cache (default):**
```
Cache location: msg._sheet

Flow:
[read data] → [process] → [read same data] → [process more]
              ↑ API call              ↑ From cache
```

**Flow-level cache (shared across flow):**
```
Cache location: flow._sheet

Multiple nodes can read from cache without redundant API calls.
```

**Global cache (shared across all flows):**
```
Cache location: global._sheet

All flows reading the same data use the same cache.
```

**Manual cache clearing:**
```javascript
// In a function node
delete msg._sheet;  // Clear message cache
delete flow._sheet; // Clear flow cache
delete global._sheet; // Clear global cache
return msg;
```

**Time-based cache invalidation:**
```javascript
// In a function node before reading
const cacheAge = Date.now() - (msg._sheet?.timestamp || 0);
const maxAge = 5 * 60 * 1000; // 5 minutes

if (cacheAge > maxAge) {
  delete msg._sheet; // Force fresh read
}
return msg;
```

</details>

### Performance Impact

<details>
<summary><b>Caching performance benefits</b> (click to expand)</summary>

**Without caching:**
- Every read = API call
- Latency: 200-500ms per call
- API quota consumed on every read

**With caching:**
- First read = API call (200-500ms)
- Subsequent reads = instant (< 1ms)
- 90%+ reduction in API calls
- Significant quota savings

**Example scenario:**

Flow processes 1000 messages, each needs to look up reference data:

```
Without cache:
- 1000 API calls
- ~300 seconds total
- 1000 quota units used

With cache:
- 1 API call
- ~0.3 seconds total
- 1 quota unit used
```

**Best for:**
- Reference data that changes infrequently
- Lookup tables
- Configuration data
- Repeated reads in processing loops

**Not recommended for:**
- Real-time data that changes frequently
- Data that must always be fresh
- Single-read scenarios

</details>

## Security

### Authentication Security

<details>
<summary><b>How credentials are protected</b> (click to expand)</summary>

**Service Account Security:**

1. **JWT (JSON Web Token) authentication**
   - No user passwords involved
   - Tokens are short-lived (1 hour)
   - Automatically refreshed when expired
   - No OAuth consent screens needed

2. **Credential encryption:**
   - All credentials encrypted by Node-RED
   - Stored in `flows_cred.json` with encryption
   - Never appear in `flows.json`
   - Cannot be exported in flows

3. **Service account email:**
   - Acts as identity: `name@project.iam.gserviceaccount.com`
   - Must be explicitly granted access to each spreadsheet
   - Can be revoked from Google Cloud Console

**What is encrypted:**
- Project ID
- Client email
- Private key (RSA 2048-bit)

**What is NOT encrypted:**
- Config node name (stored in flows.json)
- OAuth2 scopes list

</details>

### Best Practices

<details>
<summary><b>Security recommendations</b> (click to expand)</summary>

**For Service Accounts:**

1. **Grant minimum required permissions**
   - Read-only use case → Grant "Viewer" permission
   - Read/write use case → Grant "Editor" permission
   - Never grant "Owner" permission

2. **Rotate keys regularly**
   - Create new key in Google Cloud Console
   - Update Node-RED config
   - Delete old key from Google Cloud Console

3. **Use separate spreadsheets for sensitive data**
   - Don't mix production and test data
   - Apply different access controls
   - Audit access regularly

**For Node-RED:**

1. **Enable admin authentication**
   ```javascript
   // in settings.js
   adminAuth: {
     type: "credentials",
     users: [{
       username: "admin",
       password: "$2b$08$...", // bcrypt hash
       permissions: "*"
     }]
   }
   ```

2. **Set strong credentialSecret**
   ```javascript
   // in settings.js
   credentialSecret: "a-very-long-random-string-here"
   ```

3. **Backup flows securely**
   - Always backup both `flows.json` AND `flows_cred.json`
   - Store backups encrypted
   - Never commit credentials to git

</details>

### Common Security Mistakes

<details>
<summary><b>What NOT to do</b> (click to expand)</summary>

❌ **Don't commit credentials to git**
```bash
# Add to .gitignore
flows_cred.json
*.json  # If you store service account files locally
```

❌ **Don't share service account keys publicly**
- Don't paste in public forums
- Don't include in screenshots
- Don't email in plain text

❌ **Don't grant service accounts excessive permissions**
- Only grant access to specific spreadsheets
- Don't share entire Google Drive
- Revoke when no longer needed

✅ **Do use environment variables in production**
```javascript
// Instead of hardcoding
const credPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
```

</details>

## Error Handling

### Common Errors

<details>
<summary><b>Understanding error messages</b> (click to expand)</summary>

**"Authentication failed: JWT authorization failed: No key or keyFile set"**
- **Cause**: Service account credentials not properly configured
- **Fix**: Verify JSON credentials are correctly pasted, check client_email and private_key fields

**"Permission denied"**
- **Cause**: Service account doesn't have access to the spreadsheet
- **Fix**: Share spreadsheet with service account email, grant Editor or Viewer permission

**"Invalid cell range format. Use A1 notation (e.g., A1:B10)"**
- **Cause**: Range format is incorrect
- **Fix**: Use formats like `Sheet1!A1:B10`, `Sheet1`, `A:D`, `1:10`

**"Spreadsheet operation failed: Unable to parse range: Sheet1!A1:B"**
- **Cause**: Incomplete range (missing end column/row)
- **Fix**: Use `A1:B10` instead of `A1:B`, or `A:B` for entire columns

**"Invalid spreadsheet ID"**
- **Cause**: Spreadsheet ID is empty, undefined, or malformed
- **Fix**: Copy ID from URL, ensure it's a 44-character string

**"Unsupported data format"**
- **Cause**: Input data is null, undefined, or invalid type for the operation
- **Fix**: Ensure msg.payload contains array, object, or primitive value

</details>

### Debugging

<details>
<summary><b>How to debug issues</b> (click to expand)</summary>

**1. Check node status**

The node shows visual status indicators:
- 🔵 Blue dot "Processing..." → Operation in progress
- 🟢 Green dot "Success" → Operation completed
- 🔴 Red ring "Auth error" → Authentication failed
- 🔴 Red ring "Invalid range" → Range format error
- 🔴 Red dot "Error" → Other error

**2. Use debug nodes**

```
[inject] → [Google Sheets] → [debug "success"]
                          ↘ [debug "error" (catch)]
```

**3. Enable verbose logging**

In `settings.js`:
```javascript
logging: {
  console: {
    level: "debug",
    metrics: false,
    audit: false
  }
}
```

**4. Verify inputs**

Add a function node before Google Sheets to log inputs:
```javascript
node.warn("Spreadsheet ID: " + msg.spreadsheetId);
node.warn("Range: " + msg.range);
node.warn("Payload type: " + typeof msg.payload);
node.warn("Payload: " + JSON.stringify(msg.payload));
return msg;
```

**5. Test with simple data first**

Start with:
```javascript
msg.payload = [["Test"]];
msg.range = "Sheet1!A1";
```

Then gradually increase complexity.

</details>

## Troubleshooting

### Installation Issues

<details>
<summary><b>Problems installing the package</b> (click to expand)</summary>

**Issue: "Module not found" after installation**

**Cause**: Node-RED hasn't been restarted

**Solution**:
```bash
# Stop Node-RED
# Restart Node-RED
node-red-restart  # or use your system's method
```

**Issue: Nodes don't appear in palette**

**Cause**: Installation in wrong directory or Node-RED using different user directory

**Solution**:
```bash
# Find Node-RED user directory
node-red --version
# Shows: Welcome to Node-RED, v3.1.0, user directory: /home/user/.node-red

# Install there
cd /home/user/.node-red
npm install node-red-contrib-google-spreadsheet-plus
```

</details>

### Configuration Issues

<details>
<summary><b>Problems setting up credentials</b> (click to expand)</summary>

**Issue: "Invalid JSON" error when pasting credentials**

**Solution**:
- Copy entire JSON file contents
- Make sure no extra characters at beginning/end
- Check for valid JSON syntax at jsonlint.com

**Issue: Can't find service account email**

**Solution**:
- Open JSON credentials file
- Look for `"client_email"` field
- Email format: `name@project-id.iam.gserviceaccount.com`

**Issue: Spreadsheet ID keeps getting rejected**

**Solution**:
```
URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit

ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
    ↑ Copy exactly this part (44 characters) ↑
```

</details>

### Operation Issues

<details>
<summary><b>Problems reading or writing data</b> (click to expand)</summary>

**Issue: "Permission denied" error**

**Checklist**:
1. ☐ Spreadsheet is shared with service account email
2. ☐ Editor permission granted (for writes)
3. ☐ Service account email is correct
4. ☐ Sharing applies to specific sheet, not just folder

**Issue: Data comes back as `undefined`**

**Causes & Solutions**:
- Empty range: Returns empty array `[]`
- Wrong range: Check sheet name spelling
- No data: Verify data exists in range
- Cache: Clear cache and try again

**Issue: Data writes succeed but don't appear in sheet**

**Debugging steps**:
1. Check you're looking at the correct sheet tab
2. Verify range is correct (sheet name + cell range)
3. Check if data is outside visible area (scroll down/right)
4. Verify write method (Update vs Append vs New)
5. Refresh spreadsheet in browser

</details>

### Google Cloud Issues

<details>
<summary><b>Problems with Google Cloud setup</b> (click to expand)</summary>

**Issue: Can't find Google Sheets API in library**

**Solution**:
- Make sure you're in the correct project
- Search exactly: "Google Sheets API"
- Click "Enable" button
- Wait 1-2 minutes for activation

**Issue: Service account creation fails**

**Solution**:
- Check you have project Owner or Editor role
- Try creating from IAM & Admin → Service Accounts directly
- Verify project billing is enabled (even for free tier)

**Issue: Quota exceeded errors**

**Solution**:
- Check quota limits: APIs & Services → Quotas
- Default: 100 requests per 100 seconds per user
- Request quota increase if needed
- Implement rate limiting or caching

</details>

### Still Having Issues?

<details>
<summary><b>Getting help</b> (click to expand)</summary>

**Before asking for help, gather this information:**

1. **Node-RED version**: Check in Settings → About
2. **Node.js version**: `node --version`
3. **Package version**: Check in Manage palette
4. **Error message**: Full text from debug sidebar
5. **What you've tried**: List troubleshooting steps already taken

**Where to get help:**

1. **GitHub Issues**: https://github.com/carefulcomputer/node-red-contrib-google-spreadsheet/issues
   - Search existing issues first
   - Include all information above
   - Attach screenshots if helpful

2. **Node-RED Forum**: https://discourse.nodered.org
   - Tag with `google-sheets`
   - Describe your use case
   - Share relevant flow (sanitize credentials!)

**When reporting bugs:**

- ✅ Include minimal reproducible example
- ✅ Specify exact error message
- ✅ Describe expected vs actual behavior
- ❌ Don't share actual credentials
- ❌ Don't dump entire flow (make it minimal)

</details>

## License

Apache 2.0 - See [LICENSE](LICENSE) file

## Author

Careful Computer

## Support

For issues, questions, or contributions:
- GitHub: https://github.com/carefulcomputer/node-red-contrib-google-spreadsheet
- Issues: https://github.com/carefulcomputer/node-red-contrib-google-spreadsheet/issues
- Node-RED Flow Library: https://flows.nodered.org/node/node-red-contrib-google-spreadsheet-plus

## Acknowledgments

Originally derived from [node-red-contrib-viseo](https://github.com/NGRP/node-red-contrib-viseo) by VISEO Technologies.

Modernized and enhanced with:
- Latest Google APIs (googleapis 170.1.0)
- Modern JavaScript patterns (async/await, ES6+)
- Comprehensive validation and error handling
- Smart caching and performance optimizations
- Extensive documentation and examples
