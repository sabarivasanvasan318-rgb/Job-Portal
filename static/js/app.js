// =========================================
//  JobNest - Online Job Portal
//  app.js — Frontend Logic
// =========================================

let currentRole = 'seeker';
let currentPage = 'seeker-dashboard';
let currentApplyJob = null;

// ---- Sample Data ----
const jobs = [
  { id:1, title:'Senior React Developer',   company:'TechCorp India',      logo:'💻', location:'Bangalore', type:'Full-time', exp:'3-5 years', salary:'10-15 LPA', skills:['React','Redux','TypeScript'], posted:'2 days ago',  desc:'Build scalable frontend applications for our SaaS platform.' },
  { id:2, title:'Python Backend Engineer',   company:'DataSoft Solutions',  logo:'🐍', location:'Remote',     type:'Full-time', exp:'1-3 years', salary:'8-12 LPA',  skills:['Python','Django','MySQL'],      posted:'3 days ago',  desc:'Develop RESTful APIs and microservices for our data platform.' },
  { id:3, title:'UI/UX Designer',            company:'Creative Labs',       logo:'🎨', location:'Mumbai',    type:'Full-time', exp:'1-3 years', salary:'6-9 LPA',   skills:['Figma','Adobe XD','CSS'],       posted:'1 week ago',  desc:'Design beautiful and intuitive user interfaces for our products.' },
  { id:4, title:'Full Stack Developer',      company:'Startup Hub',         logo:'🚀', location:'Chennai',   type:'Full-time', exp:'3-5 years', salary:'12-18 LPA', skills:['React','Node.js','MongoDB'],    posted:'4 days ago',  desc:'Join our growing team to build end-to-end web applications.' },
  { id:5, title:'Data Analyst',              company:'Analytics Pro',       logo:'📊', location:'Delhi',     type:'Contract',  exp:'1-3 years', salary:'5-8 LPA',   skills:['Python','SQL','Power BI'],     posted:'5 days ago',  desc:'Analyze large datasets and provide actionable business insights.' },
  { id:6, title:'DevOps Engineer',           company:'CloudTech',           logo:'⚙️', location:'Bangalore', type:'Full-time', exp:'3-5 years', salary:'14-20 LPA', skills:['Docker','Kubernetes','AWS'],   posted:'1 day ago',   desc:'Manage cloud infrastructure and CI/CD pipelines.' },
];

let applications = [
  { id:1, jobId:1, candidateName:'Arjun Kumar',  candidateEmail:'arjun@email.com',  appliedOn:'20 Mar 2026', status:'shortlisted' },
  { id:2, jobId:3, candidateName:'Arjun Kumar',  candidateEmail:'arjun@email.com',  appliedOn:'15 Mar 2026', status:'pending' },
  { id:3, jobId:1, candidateName:'Priya Sharma', candidateEmail:'priya@email.com',  appliedOn:'22 Mar 2026', status:'pending' },
  { id:4, jobId:2, candidateName:'Rahul Verma',  candidateEmail:'rahul@email.com',  appliedOn:'21 Mar 2026', status:'shortlisted' },
  { id:5, jobId:4, candidateName:'Sneha Patel',  candidateEmail:'sneha@email.com',  appliedOn:'19 Mar 2026', status:'rejected' },
];

let postedJobs = [...jobs];

// ---- Navigation Config ----
const seekerNav = [
  { section:'Menu', items:[
    { id:'seeker-dashboard',    icon:'🏠', label:'Dashboard' },
    { id:'seeker-jobs',         icon:'🔍', label:'Find Jobs' },
    { id:'seeker-applications', icon:'📋', label:'My Applications' },
    { id:'seeker-profile',      icon:'👤', label:'My Profile' },
  ]}
];

const employerNav = [
  { section:'Menu', items:[
    { id:'employer-dashboard',    icon:'🏠', label:'Dashboard' },
    { id:'employer-post',         icon:'➕', label:'Post a Job' },
    { id:'employer-jobs',         icon:'📂', label:'Manage Jobs' },
    { id:'employer-applications', icon:'👥', label:'Applications' },
  ]}
];

// ---- Build Sidebar Nav ----
function buildNav(role) {
  const nav = role === 'seeker' ? seekerNav : employerNav;
  let html = '';
  nav.forEach(section => {
    html += `<div class="nav-section">${section.section}</div>`;
    section.items.forEach(item => {
      html += `<div class="nav-item" id="nav-${item.id}" onclick="navigate('${item.id}')">
                 <span class="nav-icon">${item.icon}</span>${item.label}
               </div>`;
    });
  });
  document.getElementById('navMenu').innerHTML = html;
}

// ---- Role Switch ----
function switchRole(role) {
  currentRole = role;
  document.getElementById('seekerRoleBtn').classList.toggle('active', role === 'seeker');
  document.getElementById('employerRoleBtn').classList.toggle('active', role === 'employer');

  if (role === 'seeker') {
    document.getElementById('currentUserName').textContent = 'Arjun Kumar';
    document.getElementById('topAvatar').textContent = 'AK';
    buildNav('seeker');
    navigate('seeker-dashboard');
  } else {
    document.getElementById('currentUserName').textContent = 'TechCorp India';
    document.getElementById('topAvatar').textContent = 'TC';
    buildNav('employer');
    navigate('employer-dashboard');
  }
}

// ---- Page Navigation ----
function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  const navItem = document.getElementById('nav-' + pageId);
  if (navItem) navItem.classList.add('active');

  currentPage = pageId;

  const titles = {
    'seeker-dashboard':'Dashboard', 'seeker-jobs':'Find Jobs',
    'seeker-applications':'My Applications', 'seeker-profile':'My Profile',
    'employer-dashboard':'Dashboard', 'employer-post':'Post a Job',
    'employer-jobs':'Manage Jobs', 'employer-applications':'Applications'
  };
  document.getElementById('pageTitle').textContent = titles[pageId] || 'JobNest';

  if (pageId === 'seeker-dashboard')    renderSeekerDash();
  if (pageId === 'seeker-jobs')         renderJobs();
  if (pageId === 'seeker-applications') renderMyApplications();
  if (pageId === 'employer-dashboard')  renderEmployerDash();
  if (pageId === 'employer-jobs')       renderEmployerJobs();
  if (pageId === 'employer-applications') renderEmployerApps();
}

// =========================================
//  SEEKER — Dashboard
// =========================================
function renderSeekerDash() {
  const myApps = applications.filter(a => a.candidateName === 'Arjun Kumar');
  const shortlisted = myApps.filter(a => a.status === 'shortlisted');
  document.getElementById('s-app-count').textContent  = myApps.length;
  document.getElementById('s-short-count').textContent = shortlisted.length;

  const recentDiv = document.getElementById('recentApps');
  if (!myApps.length) {
    recentDiv.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>No applications yet</p></div>';
  } else {
    recentDiv.innerHTML = myApps.slice(0,3).map(a => {
      const job = jobs.find(j => j.id === a.jobId) || {};
      return `<div class="candidate-row">
        <div class="cand-avatar">${job.logo || '🏢'}</div>
        <div class="cand-info">
          <div class="cand-name">${job.title || 'Unknown'}</div>
          <div class="cand-role">${job.company || ''} · ${a.appliedOn}</div>
        </div>
        <span class="tag ${a.status}">${a.status}</span>
      </div>`;
    }).join('');
  }

  document.getElementById('recommendedJobs').innerHTML = jobs.slice(0,3).map(j => `
    <div class="candidate-row">
      <div class="cand-avatar">${j.logo}</div>
      <div class="cand-info">
        <div class="cand-name">${j.title}</div>
        <div class="cand-role">${j.company} · ${j.salary}</div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="openApplyModal(${j.id})">Apply</button>
    </div>`).join('');
}

// =========================================
//  SEEKER — Job Listings
// =========================================
function renderJobs() {
  const search  = (document.getElementById('globalSearch').value || '').toLowerCase();
  const loc     = document.getElementById('filterLocation').value;
  const type    = document.getElementById('filterType').value;
  const myAppIds = applications.filter(a => a.candidateName === 'Arjun Kumar').map(a => a.jobId);

  const filtered = jobs.filter(j => {
    if (search && !j.title.toLowerCase().includes(search) &&
        !j.company.toLowerCase().includes(search) &&
        !j.skills.join(' ').toLowerCase().includes(search)) return false;
    if (loc  && j.location !== loc)  return false;
    if (type && j.type     !== type) return false;
    return true;
  });

  const container = document.getElementById('jobListings');
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>No jobs found. Try different filters.</p></div>';
    return;
  }

  container.innerHTML = filtered.map(j => {
    const applied = myAppIds.includes(j.id);
    return `<div class="job-card ${applied ? 'applied' : ''}">
      <div class="company-logo">${j.logo}</div>
      <div class="job-info">
        <div class="job-title">${j.title}</div>
        <div class="job-company">${j.company} · ${j.location}</div>
        <div class="job-tags">
          <span class="tag fulltime">${j.type}</span>
          <span class="tag remote">${j.location === 'Remote' ? 'Remote' : 'On-site'}</span>
          <span class="tag exp">${j.exp}</span>
          <span class="tag salary">${j.salary}</span>
          ${j.skills.slice(0,2).map(s => `<span class="tag pending">${s}</span>`).join('')}
        </div>
      </div>
      <div class="job-action">
        <span class="job-date">${j.posted}</span>
        ${applied
          ? '<span class="tag applied-tag">Applied</span>'
          : `<button class="btn btn-primary btn-sm" onclick="openApplyModal(${j.id})">Apply</button>`}
      </div>
    </div>`;
  }).join('');
}

function filterJobs() { if (currentPage === 'seeker-jobs') renderJobs(); }

// =========================================
//  SEEKER — My Applications
// =========================================
function renderMyApplications() {
  const myApps = applications.filter(a => a.candidateName === 'Arjun Kumar');
  const tbody  = document.getElementById('applicationsBody');

  if (!myApps.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted)">No applications yet</td></tr>';
    return;
  }

  tbody.innerHTML = myApps.map(a => {
    const job = jobs.find(j => j.id === a.jobId) || {};
    return `<tr>
      <td><span style="font-weight:500">${job.title || 'Unknown'}</span></td>
      <td>${job.company || '-'}</td>
      <td style="color:var(--muted)">${a.appliedOn}</td>
      <td><span class="tag ${a.status}">${a.status}</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="withdrawApp(${a.id})">Withdraw</button></td>
    </tr>`;
  }).join('');
}

function withdrawApp(id) {
  if (confirm('Withdraw this application?')) {
    applications = applications.filter(a => a.id !== id);
    renderMyApplications();
  }
}

// =========================================
//  SEEKER — Profile
// =========================================
function saveProfile() {
  const name = document.getElementById('pName').value;
  document.getElementById('profileName').textContent     = name;
  document.getElementById('profileInitials').textContent = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('profileTitle').textContent    = document.getElementById('pTitle').value + ' · ' + document.getElementById('pLocation').value;
  document.getElementById('topAvatar').textContent       = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('currentUserName').textContent = name;
  alert('Profile saved successfully!');
}

// =========================================
//  EMPLOYER — Dashboard
// =========================================
function renderEmployerDash() {
  document.getElementById('e-active-jobs').textContent  = postedJobs.length;
  document.getElementById('e-total-apps').textContent   = applications.length;
  document.getElementById('e-shortlisted').textContent  = applications.filter(a => a.status === 'shortlisted').length;

  const uniqueCandidates = [...new Map(applications.map(a => [a.candidateName, a])).values()];
  document.getElementById('recentCandidates').innerHTML = uniqueCandidates.slice(0,4).map(a => {
    const job      = jobs.find(j => j.id === a.jobId) || {};
    const initials = a.candidateName.split(' ').map(n => n[0]).join('');
    return `<div class="candidate-row">
      <div class="cand-avatar">${initials}</div>
      <div class="cand-info">
        <div class="cand-name">${a.candidateName}</div>
        <div class="cand-role">${job.title || ''} · ${a.appliedOn}</div>
      </div>
      <span class="tag ${a.status}">${a.status}</span>
    </div>`;
  }).join('');

  document.getElementById('activePostings').innerHTML = postedJobs.slice(0,3).map(j => {
    const count = applications.filter(a => a.jobId === j.id).length;
    return `<div class="candidate-row">
      <div class="cand-avatar" style="background:var(--accent-light);color:var(--accent)">${j.logo}</div>
      <div class="cand-info">
        <div class="cand-name">${j.title}</div>
        <div class="cand-role">${count} application${count !== 1 ? 's' : ''} · ${j.location}</div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="navigate('employer-applications')">View</button>
    </div>`;
  }).join('');
}

// =========================================
//  EMPLOYER — Manage Jobs
// =========================================
function renderEmployerJobs() {
  document.getElementById('employerJobList').innerHTML = postedJobs.map(j => {
    const count = applications.filter(a => a.jobId === j.id).length;
    return `<div class="job-card">
      <div class="company-logo">${j.logo}</div>
      <div class="job-info">
        <div class="job-title">${j.title}</div>
        <div class="job-company">${j.company} · ${j.location}</div>
        <div class="job-tags">
          <span class="tag fulltime">${j.type}</span>
          <span class="tag exp">${j.exp}</span>
          <span class="tag salary">${j.salary}</span>
          <span class="tag pending">${count} applicant${count !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="job-action">
        <span class="job-date">${j.posted}</span>
        <button class="btn btn-outline btn-sm" onclick="navigate('employer-applications')">View Apps</button>
        <button class="btn btn-danger  btn-sm" onclick="deleteJob(${j.id})">Remove</button>
      </div>
    </div>`;
  }).join('');
}

function deleteJob(id) {
  if (confirm('Remove this job posting?')) {
    const idx = postedJobs.findIndex(j => j.id === id);
    if (idx > -1) postedJobs.splice(idx, 1);
    renderEmployerJobs();
  }
}

// =========================================
//  EMPLOYER — Post Job
// =========================================
function postJob() {
  const title = document.getElementById('jTitle').value.trim();
  const desc  = document.getElementById('jDesc').value.trim();
  if (!title || !desc) { alert('Please fill in all required fields.'); return; }

  const newJob = {
    id:       Date.now(),
    title,
    company:  'TechCorp India',
    logo:     '🏢',
    location: document.getElementById('jLocation').value,
    type:     document.getElementById('jType').value,
    exp:      document.getElementById('jExp').value,
    salary:   document.getElementById('jSalary').value || 'Competitive',
    skills:   document.getElementById('jSkills').value.split(',').map(s => s.trim()).filter(Boolean),
    posted:   'Just now',
    desc
  };

  postedJobs.unshift(newJob);
  jobs.unshift(newJob);

  // Reset form
  ['jTitle','jDept','jSalary','jSkills','jDesc','jDeadline'].forEach(id => {
    document.getElementById(id).value = '';
  });

  alert('Job posted successfully!');
  navigate('employer-jobs');
}

// =========================================
//  EMPLOYER — Applications
// =========================================
function renderEmployerApps() {
  const filterSelect = document.getElementById('filterJobApp');
  filterSelect.innerHTML = '<option value="">All Jobs</option>' +
    postedJobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('');

  const filterVal = filterSelect.value;
  const apps = filterVal ? applications.filter(a => a.jobId == filterVal) : applications;

  document.getElementById('employerAppsBody').innerHTML = apps.map(a => {
    const job      = jobs.find(j => j.id === a.jobId) || {};
    const initials = a.candidateName.split(' ').map(n => n[0]).join('');
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="cand-avatar" style="width:32px;height:32px;font-size:12px">${initials}</div>
          <span style="font-weight:500">${a.candidateName}</span>
        </div>
      </td>
      <td>${job.title || '-'}</td>
      <td style="color:var(--muted)">${a.appliedOn}</td>
      <td><span class="tag ${a.status}">${a.status}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-success btn-sm" onclick="updateStatus(${a.id},'shortlisted')">Shortlist</button>
          <button class="btn btn-danger  btn-sm" onclick="updateStatus(${a.id},'rejected')">Reject</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function updateStatus(id, status) {
  const app = applications.find(a => a.id === id);
  if (app) { app.status = status; renderEmployerApps(); }
}

// =========================================
//  Apply Modal
// =========================================
function openApplyModal(jobId) {
  currentApplyJob = jobs.find(j => j.id === jobId);
  if (!currentApplyJob) return;
  document.getElementById('applyModalTitle').textContent = 'Apply for: ' + currentApplyJob.title;
  document.getElementById('applyModal').classList.add('open');
}

function closeModal() {
  document.getElementById('applyModal').classList.remove('open');
}

function submitApplication() {
  const name = document.getElementById('applyName').value.trim();
  if (!name || !currentApplyJob) return;

  const alreadyApplied = applications.find(a => a.jobId === currentApplyJob.id && a.candidateName === name);
  if (alreadyApplied) { alert('You have already applied for this job!'); closeModal(); return; }

  applications.push({
    id:             Date.now(),
    jobId:          currentApplyJob.id,
    candidateName:  name,
    candidateEmail: document.getElementById('applyEmail').value,
    appliedOn:      new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }),
    status:         'pending',
    coverLetter:    document.getElementById('applyCover').value
  });

  document.getElementById('applyCover').value = '';
  closeModal();
  alert('Application submitted successfully!');

  if (currentPage === 'seeker-jobs')         renderJobs();
  if (currentPage === 'seeker-applications') renderMyApplications();
  if (currentPage === 'seeker-dashboard')    renderSeekerDash();
}

// =========================================
//  Init
// =========================================
buildNav('seeker');
navigate('seeker-dashboard');
