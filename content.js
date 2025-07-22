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
  container.className = 'loc-counter-container';
  container.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0;
    padding: 16px;
    border: 1px solid var(--borderColor-default, #d0d7de);
    border-radius: 8px;
    background: var(--bgColor-muted, #f6f8fa);
    box-shadow: var(--shadow-small, 0 1px 3px rgba(31, 35, 40, 0.12));
    transition: border-color 0.2s ease;
  `;
  
  container.addEventListener('mouseenter', () => {
    container.style.borderColor = 'var(--borderColor-accent-emphasis, #0969da)';
  });
  
  container.addEventListener('mouseleave', () => {
    container.style.borderColor = 'var(--borderColor-default, #d0d7de)';
  });

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
    </svg>
    Count Lines of Code
  `;
  button.className = 'btn btn-sm';
  button.style.cssText = `
    cursor: pointer;
    background: var(--button-primary-bgColor, #1f883d);
    color: var(--button-primary-fgColor, #ffffff);
    border: 1px solid var(--button-primary-borderColor, rgba(31, 35, 40, 0.15));
    border-radius: 6px;
    padding: 6px 16px;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.background = 'var(--button-primary-bgColor-hover, #1a7f37)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.background = 'var(--button-primary-bgColor, #1f883d)';
  });

  const resultElement = document.createElement('div');
  resultElement.id = RESULT_ID;
  resultElement.style.cssText = `
    color: var(--fgColor-muted, #656d76);
    font-weight: 500;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const proxyContainer = document.createElement('div');
  proxyContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  `;

  const proxyInput = document.createElement('input');
  proxyInput.type = 'text';
  proxyInput.placeholder = 'Proxy URL (optional)';
  proxyInput.style.cssText = `
    padding: 6px 12px;
    border: 1px solid var(--borderColor-default, #d0d7de);
    border-radius: 6px;
    background: var(--bgColor-default, #ffffff);
    color: var(--fgColor-default, #1f2328);
    font-size: 14px;
    min-width: 200px;
    transition: border-color 0.2s ease;
  `;
  
  proxyInput.addEventListener('focus', () => {
    proxyInput.style.borderColor = 'var(--borderColor-accent-emphasis, #0969da)';
  });
  
  proxyInput.addEventListener('blur', () => {
    proxyInput.style.borderColor = 'var(--borderColor-default, #d0d7de)';
  });

  const saveProxyButton = document.createElement('button');
  saveProxyButton.textContent = 'Save';
  saveProxyButton.style.cssText = `
    cursor: pointer;
    background: var(--button-default-bgColor, #f6f8fa);
    color: var(--button-default-fgColor, #24292f);
    border: 1px solid var(--button-default-borderColor, rgba(31, 35, 40, 0.15));
    border-radius: 6px;
    padding: 6px 12px;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s ease;
  `;
  
  saveProxyButton.addEventListener('mouseenter', () => {
    saveProxyButton.style.background = 'var(--button-default-bgColor-hover, #f3f4f6)';
    saveProxyButton.style.borderColor = 'var(--button-default-borderColor-hover, rgba(31, 35, 40, 0.15))';
  });
  
  saveProxyButton.addEventListener('mouseleave', () => {
    saveProxyButton.style.background = 'var(--button-default-bgColor, #f6f8fa)';
    saveProxyButton.style.borderColor = 'var(--button-default-borderColor, rgba(31, 35, 40, 0.15))';
  });

  // Load saved proxy on startup
  chrome.storage.local.get('proxy', (data) => {
    if (data.proxy) {
      proxyInput.value = data.proxy;
      console.log('Loaded proxy setting:', data.proxy);
    }
  });

  saveProxyButton.addEventListener('click', () => {
    const proxyUrl = proxyInput.value.trim();
    const originalText = saveProxyButton.textContent;
    
    if (proxyUrl) {
      chrome.storage.local.set({ proxy: proxyUrl }, () => {
        saveProxyButton.textContent = '✓ Saved';
        saveProxyButton.style.color = 'var(--fgColor-success, #1a7f37)';
        setTimeout(() => {
          saveProxyButton.textContent = originalText;
          saveProxyButton.style.color = 'var(--button-default-fgColor, #24292f)';
        }, 2000);
      });
    } else {
      chrome.storage.local.remove('proxy', () => {
        saveProxyButton.textContent = '✓ Removed';
        saveProxyButton.style.color = 'var(--fgColor-success, #1a7f37)';
        setTimeout(() => {
          saveProxyButton.textContent = originalText;
          saveProxyButton.style.color = 'var(--button-default-fgColor, #24292f)';
        }, 2000);
      });
    }
  });

  // 3. Add event listener to the button
  button.addEventListener('click', () => {
    const pathParts = window.location.pathname.slice(1).split('/');
    if (pathParts.length < 2) return;
    const [owner, repo] = pathParts;

    // Update button state
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px; animation: spin 1s linear infinite;">
        <path d="M8 1a7 7 0 1 0 7 7 .75.75 0 0 1 1.5 0A8.5 8.5 0 1 1 8 0a.75.75 0 0 1 0 1.5Z"/>
      </svg>
      Analyzing...
    `;
    button.disabled = true;
    button.style.opacity = '0.6';
    button.style.cursor = 'not-allowed';
    resultElement.innerHTML = '';

    // Add loading animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    chrome.runtime.sendMessage(
      { action: "fetchLines", data: { owner, repo } },
      (response) => {
        // Remove loading styles
        document.head.removeChild(style);
        
        if (chrome.runtime.lastError) {
          resultElement.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#d1242f">
              <path d="M2.343 13.657A8 8 0 1 1 13.657 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z"/>
            </svg>
            Error: Could not connect to extension
          `;
          console.error(chrome.runtime.lastError.message);
        } else if (response.error) {
          // Show more helpful error messages
          let errorIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="#d1242f">
            <path d="M2.343 13.657A8 8 0 1 1 13.657 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z"/>
          </svg>`;
          
          let helpText = '';
          if (response.error.includes('Bad Request') || response.error.includes('private')) {
            helpText = '<br><small style="color: var(--fgColor-muted, #656d76);">💡 Try: Check if repository is public, or use a proxy if needed</small>';
          } else if (response.error.includes('not found')) {
            helpText = '<br><small style="color: var(--fgColor-muted, #656d76);">💡 Check the repository URL and try again</small>';
          }
          
          resultElement.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${errorIcon}
                <span style="color: #d1242f;">Error: ${response.error}</span>
              </div>
              ${helpText}
            </div>
          `;
          console.error('Repository analysis error:', response.error);
        } else {
          const topLanguages = Object.entries(response.languageStats || {})
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([lang, lines]) => `${lang}: ${lines.toLocaleString()}`)
            .join(', ');
          
          resultElement.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#1a7f37">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
                </svg>
                <strong>Total Lines: ${response.totalLines.toLocaleString()}</strong>
              </div>
              <div style="font-size: 12px; color: var(--fgColor-muted, #656d76);">
                Files: ${response.fileCount || 0} | Skipped: ${response.skippedFiles || 0}
              </div>
              ${topLanguages ? `<div style="font-size: 12px; color: var(--fgColor-muted, #656d76);">Top: ${topLanguages}</div>` : ''}
            </div>
          `;
        }
        
        // Reset button state
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
          </svg>
          Count Lines of Code
        `;
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      }
    );
  });

  // 4. Append elements to the page
  container.appendChild(button);
  container.appendChild(resultElement);
  
  proxyContainer.appendChild(proxyInput);
  proxyContainer.appendChild(saveProxyButton);
  container.appendChild(proxyContainer);
  
  // Insert after the injection point instead of inside it
  injectionPoint.parentNode.insertBefore(container, injectionPoint.nextSibling);
}

// --- Main Execution ---
// GitHub navigates dynamically. We need to constantly check for the right place to inject our UI.
// A MutationObserver is robust but complex. A simple interval is often sufficient and more reliable for this case.
setInterval(injectUI, 500);