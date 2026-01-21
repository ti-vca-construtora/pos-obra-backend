
let apiData = null;
let exportedEndpoints = [];
let filteredEndpoints = [];
let currentEndpointId = null;

function initFilters() {
  document
    .getElementById('methodFilter')
    .addEventListener('change', applyFiltersAndRender);

  document
    .getElementById('pathFilter')
    .addEventListener('input', applyFiltersAndRender);
}

function applyFiltersAndRender() {
  const method =
    document.getElementById('methodFilter')?.value || 'ALL';

  const path =
    document.getElementById('pathFilter')?.value
      .toLowerCase()
      .trim();

  filteredEndpoints = exportedEndpoints.filter(ep => {
    const matchMethod =
      method === 'ALL' || ep.method === method;

    const matchPath =
      !path || ep.path.toLowerCase().includes(path);

    return matchMethod && matchPath;
  });

  renderSidebar(filteredEndpoints);

  if (
    currentEndpointId &&
    !filteredEndpoints.some(e => e.id === currentEndpointId)
  ) {
    currentEndpointId = null;
    document.getElementById('documentationArea').innerHTML = `
      <div class="empty-state">
        <h3>No endpoint matches the filter</h3>
        <p>Adjust the filters to see results.</p>
      </div>
    `;
  }

  if (!currentEndpointId && filteredEndpoints.length > 0) {
    showEndpoint(filteredEndpoints[0].id);
  }
}



/* =========================
   LOAD DATA
========================= */
fetch('./api-docs.json')
  .then(r => r.json())
  .then(data => {
    exportedEndpoints = data.endpoints || [];
    filteredEndpoints = [...exportedEndpoints];

    initFilters();
    applyFiltersAndRender();
    updateEndpointCount();
  })
  .catch(err => {
    console.error('Error loading api-docs.json', err);
  });


/* =========================
   SIDEBAR
========================= */
function renderSidebar(list) {
  const container = document.getElementById('endpointsList');
  container.innerHTML = '';

  if (!list.length) {
    container.innerHTML = '<p>No endpoints found</p>';
    return;
  }

  list.forEach(ep => {
    const item = document.createElement('div');
    item.className = 'endpoint-item';
    item.onclick = () => showEndpoint(ep.id);

    item.innerHTML = `
      <span class="method-badge method-${ep.method.toLowerCase()}">
        ${ep.method}
      </span>
      <div>
        <div><strong>${ep.name}</strong></div>
        <div>${ep.path}</div>
      </div>
    `;

    container.appendChild(item);
  });
}

/* =========================
   SHOW ENDPOINT (COMPLETO)
========================= */
function showEndpoint(id) {
  currentEndpointId = id;

  const ep = exportedEndpoints.find(e => e.id === id);
  if (!ep) return;

  const container = document.getElementById('documentationArea');

  container.innerHTML = `
    <!-- HEADER -->
    <div class="endpoint-header">
      <div class="endpoint-title">
        <span class="method-badge method-${ep.method.toLowerCase()}">
          ${ep.method}
        </span>

        <div class="endpoint-main">
          <h1>${ep.name}</h1>
          <code class="endpoint-path">${ep.path}</code>
        </div>
      </div>

      ${ep.description ? `<p class="endpoint-description">${ep.description}</p>` : ''}
    </div>

    ${renderHeaders(ep.headers)}
    ${renderQueryParams(ep.queryParams)}
    ${renderBodyParams(ep.bodyParams)}
    ${renderSuccessResponse(ep.response)}
    ${renderErrorResponses(ep.errorResponses)}
  `;
}

/* =========================
   SECTIONS
========================= */
function renderHeaders(headers = []) {
  if (!headers.length) return '';

  return `
  <section class="doc-section">
    <h3>Request Headers</h3>
    <table class="params-table">
      <thead>
        <tr>
          <th>Header</th>
          <th>Value</th>
          <th>Required</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${headers.map(h => `
          <tr>
            <td><code>${h.name}</code></td>
            <td><code>${h.value || '-'}</code></td>
            <td>${h.required ? 'Yes' : 'No'}</td>
            <td>${h.description || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </section>
  `;
}

function renderQueryParams(params = []) {
  if (!params.length) return '';

  return `
  <section class="doc-section">
    <h3>Query Parameters</h3>
    <table class="params-table">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Type</th>
          <th>Required</th>
          <th>Description</th>
          <th>Example</th>
        </tr>
      </thead>
      <tbody>
        ${params.map(p => `
          <tr>
            <td><code>${p.name}</code></td>
            <td>${p.type}</td>
            <td>${p.required ? 'Yes' : 'No'}</td>
            <td>${p.description || '-'}</td>
            <td><code>${p.example ?? '-'}</code></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </section>
  `;
}

function renderBodyParams(params = []) {
  if (!params.length) return '';

  return `
  <section class="doc-section">
    <h3>Request Body</h3>
    <table class="params-table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Required</th>
          <th>Description</th>
          <th>Example</th>
        </tr>
      </thead>
      <tbody>
        ${params.map(p => `
          <tr>
            <td><code>${p.name}</code></td>
            <td>${p.type}</td>
            <td>${p.required ? 'Yes' : 'No'}</td>
            <td>${p.description || '-'}</td>
            <td><code>${p.example ?? '-'}</code></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </section>
  `;
}

function renderSuccessResponse(response) {
  if (!response) return '';

  return `
  <section class="doc-section">
    <h3>Response</h3>
    <div class="response-box">
      <strong>Status:</strong> ${response.code}<br>
      <strong>Content-Type:</strong> ${response.contentType}
    </div>

    <pre class="json-viewer">${JSON.stringify(response.example || {}, null, 2)}</pre>
  </section>
  `;
}

function renderErrorResponses(errors = []) {
  if (!errors.length) return '';

  return `
  <section class="doc-section">
    <h3>Error Responses</h3>

    ${errors.map(err => `
      <div class="error-block">
        <strong>Status:</strong> ${err.code}<br>
        <strong>Description:</strong> ${err.description || '-'}
        <pre class="json-viewer">${JSON.stringify(err.example || {}, null, 2)}</pre>
      </div>
    `).join('')}
  </section>
  `;
}

/* =========================
   COUNT
========================= */
function updateEndpointCount() {
  const el = document.getElementById('endpointCount');
  if (el) {
    el.textContent = exportedEndpoints.length + ' endpoints';
  }
}
