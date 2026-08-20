// AegisAI — Manager AI Approval & IP Enforcement Logic

const API_BASE_URL = (window.BUGHUNTERS_API_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:' || !window.location.hostname
        ? 'http://127.0.0.1:8000/api'
        : 'https://bughunters-h0w4.onrender.com/api'
)).replace(/\/$/, '');

let currentClientIp = '10.0.12.99';
let liveDetections = [];
let approvedToolsList = [
    'GitHub Copilot', 'ChatGPT Enterprise', 'Claude Team', 'Midjourney (Approved)', 'Llama-3 (Local)', 'Gemini 3.1 Pro', 'Claude Sonnet 5'
];

let ipStatusMap = {};

// Initial Shadow AI Tools catalog for review
const initialPendingTools = [
    {
        name: "Phind.com",
        domain: "phind.com",
        category: "Code Generation / Search",
        riskLevel: "high",
        riskScore: 89,
        detectedUsers: ["Clara Ng (Engineering)", "Connected Workstation IP"],
        dataFound: ["Proprietary source code", "API secret keys"],
        date: "Today, 14:20"
    },
    {
        name: "ChatPDF.com",
        domain: "chatpdf.com",
        category: "PDF Document Analyzer",
        riskLevel: "high",
        riskScore: 95,
        detectedUsers: ["Brian Tan (Finance)"],
        dataFound: ["Employee salary data", "Personal IC numbers"],
        date: "Today, 12:45"
    },
    {
        name: "Writesonic.com",
        domain: "writesonic.com",
        category: "AI Content & Essay Generator",
        riskLevel: "high",
        riskScore: 87,
        detectedUsers: ["Priya Nair (HR)"],
        dataFound: ["Employee performance ratings"],
        date: "Today, 11:30"
    },
    {
        name: "AskAI.so",
        domain: "askai.so",
        category: "Knowledge Base AI Assistant",
        riskLevel: "high",
        riskScore: 82,
        detectedUsers: ["Henry Loh (Sales)"],
        dataFound: ["Customer CRM database"],
        date: "Today, 10:15"
    },
    {
        name: "PDFSummarize.ai",
        domain: "pdfsummarize.ai",
        category: "Unregistered PDF Summarizer",
        riskLevel: "high",
        riskScore: 91,
        detectedUsers: ["Marcus Vance (Finance)"],
        dataFound: ["Revenue figures", "Unreleased earnings"],
        date: "Yesterday, 16:50"
    },
    {
        name: "PromptBase.com",
        domain: "promptbase.com",
        category: "Prompt Marketplace",
        riskLevel: "high",
        riskScore: 78,
        detectedUsers: ["Rachel Lim (Marketing)"],
        dataFound: ["Confidential brand strategy"],
        date: "Yesterday, 15:10"
    }
];

document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    await detectIp();
    await loadBackendData();
    setInterval(loadBackendData, 5000);
});

async function detectIp() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
            const data = await res.json();
            currentClientIp = data.ip;
        }
    } catch (e) {
        currentClientIp = '183.171.x.x';
    }
    const ipEl = document.getElementById('mgr-telemetry-ip');
    if (ipEl) ipEl.innerText = currentClientIp;
}

async function loadBackendData() {
    try {
        const response = await fetch(`${API_BASE_URL}/live-detections`);
        if (response.ok) {
            const data = await response.json();
            liveDetections = data.detections || [];
            if (data.summary && data.summary.approved_tools_list) {
                approvedToolsList = data.summary.approved_tools_list;
            }
        }
    } catch (e) {
        console.warn('Backend offline, using local state:', e);
    }

    renderPendingTools();
    renderApprovedTools();
    renderIpTable();
    updateCounters();
}

function updateCounters() {
    const pendingTools = getPendingTools();
    document.getElementById('mgr-pending-count').innerText = pendingTools.length;
    document.getElementById('mgr-approved-count').innerText = approvedToolsList.length;

    const restrictedCount = Object.values(ipStatusMap).filter(s => s === 'restricted').length;
    document.getElementById('mgr-restricted-ip-count').innerText = restrictedCount;

    const badge = document.getElementById('pending-count-badge');
    if (badge) {
        badge.innerText = pendingTools.length;
        badge.classList.toggle('hidden', pendingTools.length === 0);
    }
}

function getPendingTools() {
    // Combine initialPendingTools + any new unapproved tools found in liveDetections
    const list = [...initialPendingTools];

    liveDetections.forEach(det => {
        if (!det.toolApproved && det.tool) {
            const exists = list.some(t => t.name.toLowerCase() === det.tool.toLowerCase());
            if (!exists) {
                list.unshift({
                    name: det.tool,
                    domain: det.tool.toLowerCase().replace(/[^a-z0-9.]/g, '') + '.com',
                    category: det.fileType || 'Shadow AI Tool',
                    riskLevel: det.riskLevel || 'high',
                    riskScore: det.riskScore || 85,
                    detectedUsers: [`Workstation (${det.ip})`],
                    dataFound: det.dataFound || ['Unapproved AI tool search'],
                    date: det.date || 'Just now'
                });
            }
        }
    });

    // Filter out tools already in approvedToolsList
    return list.filter(t => !isToolApproved(t.name));
}

function isToolApproved(toolName) {
    return approvedToolsList.some(app => 
        strEquals(app, toolName) || 
        toolName.toLowerCase().includes(app.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim())
    );
}

function strEquals(a, b) {
    return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
}

function renderPendingTools() {
    const container = document.getElementById('pending-tools-container');
    if (!container) return;

    const pending = getPendingTools();

    if (pending.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px;background:rgba(6,9,14,0.4);border-radius:12px;border:1px dashed var(--border);">
                <i data-lucide="check-circle-2" style="width:48px;height:48px;color:#10b981;margin-bottom:12px;"></i>
                <h3 style="color:#fff;">No Pending Shadow AI Approvals</h3>
                <p style="color:var(--muted);font-size:0.85rem;margin-top:4px;">All detected AI tools are currently reviewed and governed by manager policy.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = pending.map(t => `
        <div class="tool-approval-card high-risk" id="card-tool-${t.name.replace(/[^a-zA-Z0-9]/g, '')}">
            <div class="tool-card-header">
                <div class="tool-card-title">
                    <div class="tool-icon-bg"><i data-lucide="bot"></i></div>
                    <div>
                        <h3>${t.name}</h3>
                        <p>${t.category}</p>
                    </div>
                </div>
                <span class="badge badge-danger">${t.riskScore}/100 Risk</span>
            </div>

            <div class="tool-meta-list">
                <div class="tool-meta-row">
                    <span>Domain / URL:</span>
                    <strong>${t.domain}</strong>
                </div>
                <div class="tool-meta-row">
                    <span>Detected Endpoints:</span>
                    <strong>${t.detectedUsers.join(', ')}</strong>
                </div>
                <div class="tool-meta-row">
                    <span>Sensitive Content Risk:</span>
                    <strong style="color:#ff3366;">${(t.dataFound || []).join(', ')}</strong>
                </div>
            </div>

            <div class="tool-actions">
                <button class="btn-approve" onclick="approveTool('${t.name}')">
                    <i data-lucide="check-circle"></i> Approve & Whitelist
                </button>
                <button class="btn-reject" onclick="rejectTool('${t.name}')">
                    <i data-lucide="ban"></i> Deny & Block
                </button>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

async function approveTool(toolName) {
    try {
        const response = await fetch(`${API_BASE_URL}/live-detections/approve-tool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: toolName })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.approved_tools) approvedToolsList = data.approved_tools;
            else if (!approvedToolsList.includes(toolName)) approvedToolsList.push(toolName);

            showToast(`AI Tool '${toolName}' has been APPROVED and Whitelisted enterprise-wide!`, 'success');
        } else {
            if (!approvedToolsList.includes(toolName)) approvedToolsList.push(toolName);
            showToast(`Approved '${toolName}' (Local State)`, 'success');
        }
    } catch (e) {
        if (!approvedToolsList.includes(toolName)) approvedToolsList.push(toolName);
        showToast(`Approved '${toolName}' (Local Mode)`, 'success');
    }

    renderPendingTools();
    renderApprovedTools();
    updateCounters();
}

async function rejectTool(toolName) {
    try {
        await fetch(`${API_BASE_URL}/live-detections/reject-tool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: toolName })
        });
    } catch (e) { }

    showToast(`AI Tool '${toolName}' permanently DENIED by manager. Pre-upload interception active.`, 'danger');
    renderPendingTools();
    updateCounters();
}

function renderApprovedTools() {
    const tbody = document.getElementById('approved-tools-table-body');
    if (!tbody) return;

    tbody.innerHTML = approvedToolsList.map(tool => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <i data-lucide="shield-check" style="color:#10b981;width:18px;height:18px;"></i>
                    <strong style="color:#fff;">${tool}</strong>
                </div>
            </td>
            <td><span class="badge badge-success">Whitelisted & Active</span></td>
            <td>Corporate Authorized AI</td>
            <td>Enterprise Compliance Tier 1 (Scanned)</td>
            <td class="text-center">
                <button class="btn btn-outline" style="font-size:0.75rem;padding:4px 8px;" onclick="revokeApproval('${tool}')">
                    Revoke Approval
                </button>
            </td>
        </tr>
    `).join('');

    lucide.createIcons();
}

async function revokeApproval(toolName) {
    approvedToolsList = approvedToolsList.filter(t => !strEquals(t, toolName));
    try {
        await fetch(`${API_BASE_URL}/live-detections/reject-tool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: toolName })
        });
    } catch (e) { }

    showToast(`Approval revoked for '${toolName}'. Tool restored to unapproved status.`, 'warning');
    renderApprovedTools();
    renderPendingTools();
    updateCounters();
}

function renderIpTable() {
    const tbody = document.getElementById('ip-table-body');
    if (!tbody) return;

    // Collect all workstation IPs from liveDetections and currentClientIp
    const ipMap = {};

    ipMap[currentClientIp] = {
        ip: currentClientIp,
        worker: "Your Connected Workstation",
        tool: "Real-time Telemetry Active",
        status: ipStatusMap[currentClientIp] || "clean",
        updated: "Just now"
    };

    liveDetections.forEach(d => {
        if (d.ip) {
            ipMap[d.ip] = {
                ip: d.ip,
                worker: d.name || `Workstation (${d.ip})`,
                tool: d.tool || "Shadow AI Search",
                status: ipStatusMap[d.ip] || (d.uploadStatus === 'Access Restricted' ? 'restricted' : (d.uploadStatus === 'Warning Issued' ? 'warning' : 'clean')),
                updated: d.date || "Today"
            };
        }
    });

    const rows = Object.values(ipMap);

    tbody.innerHTML = rows.map(r => {
        let statusBadge = '<span class="badge badge-success">🟢 Clean — Monitoring</span>';
        if (r.status === 'restricted') statusBadge = '<span class="badge badge-danger">🔴 ACCESS RESTRICTED</span>';
        else if (r.status === 'warning') statusBadge = '<span class="badge badge-warning">🟡 Warning Issued</span>';

        return `
            <tr>
                <td><strong style="color:#00f0ff;font-family:var(--mono);">${r.ip}</strong></td>
                <td>${r.worker}</td>
                <td><em>${r.tool}</em></td>
                <td>${statusBadge}</td>
                <td>${r.updated}</td>
                <td class="text-center">
                    ${r.status === 'restricted' 
                        ? `<button class="btn btn-outline" style="font-size:0.75rem;padding:4px 10px;" onclick="updateIpAction('${r.ip}', 'dismiss')">Clear Restriction</button>`
                        : `<button class="btn btn-danger" style="font-size:0.75rem;padding:4px 10px;" onclick="updateIpAction('${r.ip}', 'block')">Restrict IP</button>`
                    }
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

async function updateIpAction(ip, action) {
    ipStatusMap[ip] = action === 'block' ? 'restricted' : (action === 'warn' ? 'warning' : 'clean');

    try {
        await fetch(`${API_BASE_URL}/live-detections/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: ip, action: action })
        });
    } catch (e) { }

    showToast(`IP Action '${action.toUpperCase()}' applied to workstation IP: ${ip}`, action === 'block' ? 'danger' : 'success');
    renderPendingTools();
    renderApprovedTools();
    renderIpTable();
    loadKillSwitches();
    loadAppeals();
    updateCounters();
}

async function submitFastAssessment(event) {
    event.preventDefault();
    const toolName = document.getElementById('survey-tool-name').value.trim();
    const domain = document.getElementById('survey-domain').value.trim();
    const q1 = document.getElementById('survey-q1').value === 'true';
    const q2 = document.getElementById('survey-q2').value === 'true';
    const q3 = document.getElementById('survey-q3').value === 'true';

    try {
        const res = await fetch(`${API_BASE_URL}/v1/ai-tools/request-approval`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tool_name: toolName,
                domain: domain,
                stores_company_data: q1,
                handles_pii_financial: q2,
                enterprise_certified: q3,
                requested_by: 'Connected Employee',
                department: 'Engineering'
            })
        });

        const data = await res.json();
        if (data.status === 'approved') {
            showToast(`⚡ FAST-PATH SUCCESS: '${toolName}' was AUTO-APPROVED instantly!`, 'success');
            if (!approvedToolsList.includes(toolName)) approvedToolsList.push(toolName);
        } else {
            showToast(`HIGH-RISK ASSESSMENT: '${toolName}' routed to Manager Review Queue.`, 'warning');
            initialPendingTools.unshift({
                name: toolName,
                domain: domain,
                category: "Employee Survey Request",
                riskLevel: "high",
                riskScore: data.risk_score || 88,
                detectedUsers: ["Employee Assessment"],
                dataFound: ["High-Risk Assessment Flags"],
                date: "Just now"
            });
        }
    } catch (e) {
        showToast(`Request for '${toolName}' submitted.`, 'info');
    }

    document.getElementById('fast-assessment-form').reset();
    renderPendingTools();
    renderApprovedTools();
    updateCounters();
    switchTab('pending');
}

async function triggerVulnerabilityKillSwitch() {
    const model = document.getElementById('vuln-model-select').value;
    try {
        const res = await fetch(`${API_BASE_URL}/v1/vulnerability-check/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: model, ip: currentClientIp })
        });
        const data = await res.json();
        showToast(`🚨 KILL SWITCH ENGAGED: Model '${model}' banned and persisted to config/kill_switches.json!`, 'danger');
    } catch (e) {
        showToast(`Kill switch triggered for '${model}' (Local mode)`, 'danger');
    }

    loadKillSwitches();
}

async function loadKillSwitches() {
    const container = document.getElementById('kill-switch-active-list');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/v1/vulnerability-check/status`);
        if (res.ok) {
            const data = await res.json();
            const switches = data.active_kill_switches || [];

            if (switches.length === 0) {
                container.innerHTML = `<div style="font-size:0.85rem;color:var(--muted);padding:10px;">No active vulnerability kill switches persistent in JSON.</div>`;
                return;
            }

            container.innerHTML = switches.map(s => `
                <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);padding:12px 16px;border-radius:8px;margin-bottom:8px;">
                    <div>
                        <strong style="color:#ef4444;">🚨 ${s.model_name}</strong>
                        <span style="font-size:0.8rem;color:var(--muted);margin-left:10px;">${s.cve_id} &middot; ${s.vulnerability}</span>
                    </div>
                    <button class="btn btn-outline" style="font-size:0.75rem;padding:4px 10px;" onclick="revokeKillSwitch('${s.model_name}')">
                        Revoke Kill Switch
                    </button>
                </div>
            `).join('');
            lucide.createIcons();
        }
    } catch (e) { }
}

async function revokeKillSwitch(modelName) {
    try {
        await fetch(`${API_BASE_URL}/v1/vulnerability-check/revoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName })
        });
        showToast(`Kill switch revoked for model '${modelName}'.`, 'success');
    } catch (e) { }
    loadKillSwitches();
}

async function loadAppeals() {
    const tbody = document.getElementById('appeals-table-body');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE_URL}/v1/incidents/appeals`);
        if (res.ok) {
            const data = await res.json();
            const appeals = data.appeals || [];

            if (appeals.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:20px;">No pending employee appeals in queue.</td></tr>`;
                return;
            }

            tbody.innerHTML = appeals.map(a => `
                <tr>
                    <td><strong>${a.employee_name}</strong></td>
                    <td><span style="font-family:var(--mono);color:#00f0ff;">${a.ip}</span></td>
                    <td><em>${a.tool_or_model}</em></td>
                    <td style="font-size:0.82rem;max-width:260px;">${a.justification}</td>
                    <td><span class="badge ${a.status === 'approved' ? 'badge-success' : (a.status === 'denied' ? 'badge-danger' : 'badge-warning')}">${a.status}</span></td>
                    <td class="text-center">
                        ${a.status === 'pending_review' ? `
                            <button class="btn btn-outline" style="font-size:0.75rem;padding:4px 8px;margin-right:4px;" onclick="actionAppeal('${a.id}', 'approved')">Approve</button>
                            <button class="btn btn-danger" style="font-size:0.75rem;padding:4px 8px;" onclick="actionAppeal('${a.id}', 'denied')">Deny</button>
                        ` : '<span class="text-muted" style="font-size:0.8rem;">Reviewed</span>'}
                    </td>
                </tr>
            `).join('');
            lucide.createIcons();
        }
    } catch (e) { }
}

async function actionAppeal(appealId, action) {
    try {
        await fetch(`${API_BASE_URL}/v1/incidents/appeals/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appeal_id: appealId, action: action })
        });
        showToast(`Appeal ${appealId} marked as '${action.toUpperCase()}'.`, action === 'approved' ? 'success' : 'danger');
    } catch (e) { }
    loadAppeals();
}

function applyCustomIpAction(action) {
    const input = document.getElementById('custom-ip-input');
    const ip = input ? input.value.trim() : '';
    if (!ip) {
        showToast('Please enter a valid IP address', 'warning');
        return;
    }
    updateIpAction(ip, action);
    if (input) input.value = '';
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(sec => sec.classList.add('hidden'));

    const activeTab = document.getElementById(`tab-${tabName}`);
    const activeSec = document.getElementById(`section-${tabName}`);

    if (activeTab) activeTab.classList.add('active');
    if (activeSec) activeSec.classList.remove('hidden');
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.style.background = type === 'danger' ? 'rgba(255,51,102,0.95)' : (type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(0,240,255,0.95)');
    toast.style.color = type === 'info' || type === 'success' ? '#06090e' : '#fff';
    toast.style.padding = '12px 18px';
    toast.style.borderRadius = '8px';
    toast.style.fontWeight = '600';
    toast.style.fontSize = '0.85rem';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
    toast.style.transition = 'all 0.3s ease';

    toast.innerText = msg;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
