const INJECTION_POINT_SELECTOR = '[data-testid="latest-commit-details"], .js-details-container, .repository-content';
const BUTTON_ID = 'loc-button';
const RESULT_ID = 'loc-result';

function injectUI() {
  // 1. Check if we should inject
  const injectionPoint = document.querySelector(INJECTION_POINT_SELECTOR);
  if (!injectionPoint || document.getElementById(BUTTON_ID)) {
    return; // Either the page isn't ready or we've already injected the button
  }

  // 2. Create the UI elements
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '8px';
  container.style.margin = '16px 0';
  container.style.padding = '12px';
  container.style.border = '1px solid #d0d7de';
  container.style.borderRadius = '6px';
  container.style.backgroundColor = '#f6f8fa';

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.textContent = 'Count Total Lines';
  button.className = 'btn btn-sm btn-primary';
  button.style.cursor = 'pointer';

  const resultElement = document.createElement('div');
  resultElement.id = RESULT_ID;
  resultElement.style.color = '#6a737d'; // Match GitHub's secondary text color

  const proxyInput = document.createElement('input');
  proxyInput.type = 'text';
  proxyInput.placeholder = 'e.g., http://127.0.0.1:33000';
  proxyInput.style.marginLeft = 'auto'; // Push to the right

  const saveProxyButton = document.createElement('button');
  saveProxyButton.textContent = 'Save Proxy';
  saveProxyButton.className = 'btn btn-sm';

  // Load saved proxy on startup
  chrome.storage.local.get('proxy', (data) => {
    if (data.proxy) {
      proxyInput.value = data.proxy;
    }
  });

  saveProxyButton.addEventListener('click', () => {
    const proxyUrl = proxyInput.value.trim();
    if (proxyUrl) {
      chrome.storage.local.set({ proxy: proxyUrl }, () => {
        alert('Proxy saved!');
      });
    } else {
      chrome.storage.local.remove('proxy', () => {
        alert('Proxy removed!');
      });
    }
  });

  // 3. Add event listener to the button
  button.addEventListener('click', () => {
    const pathParts = window.location.pathname.slice(1).split('/');
    if (pathParts.length < 2) return;
    const [owner, repo] = pathParts;

    button.textContent = 'Analyzing...';
    button.disabled = true;
    resultElement.textContent = '';

    chrome.runtime.sendMessage(
      { action: "fetchLines", data: { owner, repo } },
      (response) => {
        if (chrome.runtime.lastError) {
          resultElement.textContent = 'Error: Could not connect to the extension.';
          console.error(chrome.runtime.lastError.message);
        } else if (response.error) {
          resultElement.textContent = `Error: ${response.error}`;
          console.error(response.error);
        } else {
          resultElement.textContent = `Total Lines: ${response.totalLines.toLocaleString()}`;
        }
        button.textContent = 'Count Total Lines';
        button.disabled = false;
      }
    );
  });

  // 4. Append elements to the page
  container.appendChild(button);
  container.appendChild(resultElement);
  container.appendChild(proxyInput);
  container.appendChild(saveProxyButton);
  
  // Insert after the injection point instead of inside it
  injectionPoint.parentNode.insertBefore(container, injectionPoint.nextSibling);
}

// --- Main Execution ---
// GitHub navigates dynamically. We need to constantly check for the right place to inject our UI.
// A MutationObserver is robust but complex. A simple interval is often sufficient and more reliable for this case.
setInterval(injectUI, 500);