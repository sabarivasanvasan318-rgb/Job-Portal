# JobNest - Online Job Portal
## Project Setup Guide

---

## Tech Stack
- **Front End:** HTML, CSS, JavaScript
- **Back End:** Python (Flask)
- **Database:** MySQL

---

## Project Structure

```
jobnest/
├── app.py                  # Flask backend (all API routes)
├── database.sql            # MySQL schema + sample data
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Main frontend HTML
└── static/
    ├── css/
    │   └── style.css       # All styles
    └── js/
        └── app.js          # Frontend JavaScript logic
```

---

## Installation & Setup

### Step 1 — Install Python dependencies
```bash
pip install -r requirements.txt
```

### Step 2 — Set up MySQL database
1. Open MySQL Workbench or terminal
2. Run the SQL file:
```bash
mysql -u root -p < database.sql
```

### Step 3 — Configure database connection
Open `app.py` and update the DB_CONFIG section:
```python
DB_CONFIG = {
    'host':     'localhost',
    'database': 'jobnest_db',
    'user':     'root',
    'password': 'YOUR_MYSQL_PASSWORD',  # ← Change this
    'port':     3306
}
```

### Step 4 — Run the Flask server
```bash
python app.py
```

### Step 5 — Open in browser
```
http://localhost:5000
```

---

## Sample Login Credentials (for testing)

| Role     | Email                     | Password    |
|----------|---------------------------|-------------|
| Seeker   | arjun@example.com         | password123 |
| Seeker   | priya@example.com         | password123 |
| Employer | techcorp@example.com      | password123 |
| Employer | creativelabs@example.com  | password123 |

---

## API Endpoints

### Auth
| Method | Route           | Description         |
|--------|-----------------|---------------------|
| POST   | /api/register   | Register new user   |
| POST   | /api/login      | Login               |
| POST   | /api/logout     | Logout              |

### Jobs
| Method | Route              | Description              |
|--------|--------------------|--------------------------|
| GET    | /api/jobs          | Get all jobs (+ filters) |
| POST   | /api/jobs          | Post a new job           |
| DELETE | /api/jobs/:id      | Remove a job             |

### Applications
| Method | Route                         | Description                   |
|--------|-------------------------------|-------------------------------|
| POST   | /api/applications             | Submit application            |
| GET    | /api/applications/my          | Seeker's applications         |
| GET    | /api/applications/employer    | Employer's received apps      |
| PUT    | /api/applications/:id/status  | Update status                 |
| DELETE | /api/applications/:id         | Withdraw application          |

### Profile & Stats
| Method | Route              | Description         |
|--------|--------------------|---------------------|
| GET    | /api/profile       | Get profile         |
| PUT    | /api/profile       | Update profile      |
| GET    | /api/stats/seeker  | Seeker dashboard    |
| GET    | /api/stats/employer| Employer dashboard  |

---

## Features

### Job Seeker
- Register and login
- Search and filter jobs by location, type, experience, salary
- Apply to jobs with cover letter
- Track application status (pending / shortlisted / rejected)
- Withdraw applications
- Edit profile, upload resume

### Employer
- Register and login
- Post new job listings
- View and manage all job postings
- Review candidate applications
- Shortlist or reject applicants
- Dashboard with hiring stats
