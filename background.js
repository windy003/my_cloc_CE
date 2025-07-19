importScripts('jszip.min.js');

async function countLinesInZip(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);
  let totalLines = 0;

  const isBinary = (file) => {
    // A simple heuristic to detect binary files.
    const NON_TEXT_EXTENSIONS = [
      'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'ico', 'svg',
      'mp3', 'wav', 'ogg', 'flac', 'aac',
      'mp4', 'mov', 'avi', 'mkv', 'webm',
      'zip', 'gz', 'tar', 'rar', '7z',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'exe', 'dll', 'so', 'o', 'a', 'lib',
      'jar', 'war', 'ear',
      'class',
      'pyc', 'pyd',
      'lock', 'sum'
    ];
    const extension = file.name.split('.').pop().toLowerCase();
    return NON_TEXT_EXTENSIONS.includes(extension);
  };

  for (const [relativePath, file] of Object.entries(zip.files)) {
    if (!file.dir && !isBinary(file)) {
      try {
        const content = await file.async('string');
        const lines = content.split('\n').length;
        totalLines += lines;
      } catch (e) {
        console.warn(`Could not read file ${relativePath} as text, skipping.`);
      }
    }
  }

  return totalLines;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchLines") {
    const { owner, repo } = request.data;

    fetch(`https://api.github.com/repos/${owner}/${repo}`)
      .then(response => {
        if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        const defaultBranch = data.default_branch;
        return fetch(`https://api.github.com/repos/${owner}/${repo}/zip/${defaultBranch}`);
      })
      .then(response => {
        if (!response.ok) throw new Error(`Failed to download zip: ${response.statusText}`);
        return response.arrayBuffer();
      })
      .then(arrayBuffer => countLinesInZip(arrayBuffer))
      .then(totalLines => {
        sendResponse({ totalLines });
      })
      .catch(error => {
        console.error('Error processing repository:', error);
        sendResponse({ error: error.message });
      });

    return true; // Indicates that the response is sent asynchronously
  }
});