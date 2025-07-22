importScripts('jszip.min.js');

async function countLinesInZip(zipFile) {
  try {
    const zip = await JSZip.loadAsync(zipFile);
    let totalLines = 0;
    let fileCount = 0;
    let skippedFiles = 0;
    const languageStats = {};

  const isBinary = (file) => {
    const NON_TEXT_EXTENSIONS = [
      'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'ico', 'svg',
      'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'mp2',
      'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv',
      'zip', 'gz', 'tar', 'rar', '7z', 'bz2', 'xz',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'exe', 'dll', 'so', 'o', 'a', 'lib', 'dylib',
      'jar', 'war', 'ear', 'aar',
      'class', 'dex',
      'pyc', 'pyd', 'pyo',
      'lock', 'sum', 'cache',
      'woff', 'woff2', 'ttf', 'eot', 'otf',
      'bin', 'dat', 'db', 'sqlite', 'sqlite3',
      'min.js', 'min.css', 'bundle.js', 'bundle.css'
    ];
    
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop();
    
    // Check for minified files
    if (fileName.includes('.min.') || fileName.includes('.bundle.')) {
      return true;
    }
    
    // Check for common directories to skip
    const pathParts = fileName.split('/');
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'vendor', '__pycache__', '.idea', '.vscode'];
    if (pathParts.some(part => skipDirs.includes(part))) {
      return true;
    }
    
    return NON_TEXT_EXTENSIONS.includes(extension);
  };

  const getLanguage = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'JavaScript', 'jsx': 'JavaScript', 'mjs': 'JavaScript',
      'ts': 'TypeScript', 'tsx': 'TypeScript',
      'py': 'Python', 'pyw': 'Python',
      'java': 'Java', 'kt': 'Kotlin', 'scala': 'Scala',
      'c': 'C', 'h': 'C',
      'cpp': 'C++', 'cxx': 'C++', 'cc': 'C++', 'hpp': 'C++',
      'cs': 'C#', 'fs': 'F#',
      'go': 'Go',
      'rs': 'Rust',
      'php': 'PHP',
      'rb': 'Ruby',
      'swift': 'Swift',
      'html': 'HTML', 'htm': 'HTML',
      'css': 'CSS', 'scss': 'SCSS', 'sass': 'Sass', 'less': 'Less',
      'json': 'JSON', 'xml': 'XML', 'yaml': 'YAML', 'yml': 'YAML',
      'md': 'Markdown', 'txt': 'Text',
      'sh': 'Shell', 'bash': 'Shell', 'zsh': 'Shell',
      'sql': 'SQL',
      'r': 'R', 'R': 'R',
      'dart': 'Dart',
      'vue': 'Vue',
      'svelte': 'Svelte'
    };
    return languageMap[extension] || 'Other';
  };

  for (const [relativePath, file] of Object.entries(zip.files)) {
    if (!file.dir && !isBinary(file)) {
      try {
        const content = await file.async('string');
        
        // Skip files that appear to be binary based on content
        const nullBytes = (content.match(/\0/g) || []).length;
        if (nullBytes > content.length * 0.01) {
          skippedFiles++;
          continue;
        }
        
        const lines = content.split('\n').length;
        totalLines += lines;
        fileCount++;
        
        const language = getLanguage(file.name);
        languageStats[language] = (languageStats[language] || 0) + lines;
        
      } catch (e) {
        console.warn(`Could not read file ${relativePath} as text, skipping.`);
        skippedFiles++;
      }
    }
  }

    return {
      totalLines,
      fileCount,
      skippedFiles,
      languageStats
    };
  } catch (error) {
    console.error('Error processing ZIP file:', error);
    throw new Error(`Failed to process repository archive: ${error.message}`);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchLines") {
    const { owner, repo } = request.data;

    // Check cache first
    const cacheKey = `${owner}/${repo}`;
    chrome.storage.local.get([cacheKey, 'proxy'], (storageData) => {
      const cachedData = storageData[cacheKey];
      const proxyUrl = storageData.proxy;
      
      console.log('Repository:', `${owner}/${repo}`);
      console.log('Proxy setting:', proxyUrl || 'No proxy configured');
      
      // If cached data exists and is less than 1 hour old, use it
      if (cachedData && Date.now() - cachedData.timestamp < 3600000) {
        console.log('Using cached data for', cacheKey);
        sendResponse(cachedData.result);
        return;
      }

      // Fetch fresh data
      fetch(`https://api.github.com/repos/${owner}/${repo}`)
        .then(response => {
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(`Repository not found: ${owner}/${repo}`);
            } else if (response.status === 403) {
              throw new Error(`Access denied. Repository may be private or rate limited.`);
            }
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Repository data:', data);
          const defaultBranch = data.default_branch || 'main';
          
          // Check if repository is empty
          if (data.size === 0) {
            throw new Error('Repository is empty (no files to analyze)');
          }
          
          // Try common branch names if default branch fails
          const branchesToTry = [defaultBranch];
          if (!branchesToTry.includes('main')) branchesToTry.push('main');
          if (!branchesToTry.includes('master')) branchesToTry.push('master');
          
          const downloadUrls = [];
          
          // Generate URLs for each branch
          branchesToTry.forEach(branch => {
            downloadUrls.push(
              `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`,
              `https://codeload.github.com/${owner}/${repo}/zip/${branch}`,
              `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`,
              `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`,
              `https://github.com/${owner}/${repo}/archive/${branch}.zip`
            );
          });
          
          // Try each URL until one works
          async function tryDownload(urls) {
            let lastError = null;
            
            for (let i = 0; i < urls.length; i++) {
              const url = urls[i];
              
              // If using proxy, try multiple proxy formats
              const urlsToTry = [];
              
              if (proxyUrl) {
                // Fix proxy URL format if needed
                let cleanProxyUrl = proxyUrl.trim();
                if (!cleanProxyUrl.startsWith('http://') && !cleanProxyUrl.startsWith('https://')) {
                  cleanProxyUrl = 'http://' + cleanProxyUrl;
                }
                cleanProxyUrl = cleanProxyUrl.replace(/\/$/, '');
                
                // Try different proxy formats
                urlsToTry.push(
                  `${cleanProxyUrl}/${url}`,                              // Format 1: proxy/full_url
                  `${cleanProxyUrl}/${url.replace(/^https?:\/\//, '')}`,  // Format 2: proxy/url_without_protocol
                  `${cleanProxyUrl}/proxy/${url}`,                       // Format 3: proxy/proxy/full_url
                  url                                                     // Format 4: direct (fallback)
                );
              } else {
                urlsToTry.push(url);
              }
              
              // Try each proxy format for this URL
              for (let j = 0; j < urlsToTry.length; j++) {
                const finalUrl = urlsToTry[j];
                
                try {
                  console.log(`Trying URL ${i + 1}/${urls.length}, format ${j + 1}/${urlsToTry.length}:`, finalUrl);
                  
                  const response = await fetch(finalUrl, {
                    headers: {
                      'User-Agent': 'GitHub-LOC-Counter-Extension',
                      'Accept': 'application/zip, application/octet-stream, */*'
                    }
                  });
                  
                  console.log(`Response:`, response.status, response.statusText);
                  
                  if (response.ok) {
                    const contentLength = response.headers.get('content-length');
                    console.log(`✅ Successfully downloaded! Size: ${contentLength} bytes`);
                    return response.arrayBuffer();
                  }
                  
                  lastError = `HTTP ${response.status}: ${response.statusText}`;
                  console.warn(`❌ Failed:`, lastError);
                  
                } catch (error) {
                  lastError = error.message;
                  console.warn(`❌ Error:`, error.message);
                }
              }
            }
            
            // Provide more specific error message
            if (lastError && lastError.includes('400')) {
              throw new Error(`Repository download failed (Bad Request). This usually means the repository doesn't exist, is private, or the branch name is incorrect. Repository: ${owner}/${repo}, Branch: ${defaultBranch}`);
            } else if (lastError && lastError.includes('404')) {
              throw new Error(`Repository not found: ${owner}/${repo}. Please check if the repository exists and is public.`);
            } else {
              throw new Error(`Failed to download repository after trying ${urls.length} different URLs. Last error: ${lastError}`);
            }
          }
          
          return tryDownload(downloadUrls);
        })
        .then(arrayBuffer => {
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error('Downloaded file is empty or corrupted');
          }
          return countLinesInZip(arrayBuffer);
        })
        .then(result => {
          if (!result || result.totalLines === 0) {
            console.warn('No countable lines found in repository');
          }
          
          // Cache the result
          const cacheData = {
            result,
            timestamp: Date.now()
          };
          chrome.storage.local.set({ [cacheKey]: cacheData });
          
          sendResponse(result);
        })
        .catch(error => {
          console.error('Error processing repository:', error);
          
          // Provide more helpful error messages
          let userMessage = error.message;
          if (error.message.includes('Failed to download')) {
            userMessage = 'Unable to download repository. Please check if the repository exists and is public.';
          } else if (error.message.includes('GitHub API error')) {
            userMessage = 'GitHub API error. Please try again later.';
          } else if (error.message.includes('corrupted')) {
            userMessage = 'Downloaded file appears to be corrupted. Please try again.';
          }
          
          sendResponse({ error: userMessage });
        });
    });

    return true; // Indicates that the response is sent asynchronously
  }
});