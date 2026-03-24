# =========================================
#  JobNest - Online Job Portal
#  app.py — Flask Backend
#  Backend: Python (Flask)
#  Database: MySQL
# =========================================

from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import hashlib
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'jobnest_secret_key_change_in_production'
CORS(app)

# =========================================
#  Database Configuration
# =========================================
DB_CONFIG = {
    'host':     'localhost',
    'database': 'jobnest_db',
    'user':     'root',
    'password': 'your_password_here',   # Change this
    'port':     3306
}

def get_db_connection():
    """Create and return a MySQL database connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Database connection error: {e}")
        return None

def hash_password(password):
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


# =========================================
#  Serve Frontend
# =========================================
@app.route('/')
def index():
    return render_template('index.html')


# =========================================
#  AUTH ROUTES
# =========================================

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user (job seeker or employer)."""
    data = request.get_json()
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role     = data.get('role', 'seeker')   # 'seeker' or 'employer'

    if not name or not email or not password:
        return jsonify({'success': False, 'message': 'All fields are required.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Email already registered.'}), 409

        hashed = hash_password(password)
        cursor.execute(
            'INSERT INTO users (name, email, password, role, created_at) VALUES (%s, %s, %s, %s, %s)',
            (name, email, hashed, role, datetime.now())
        )
        conn.commit()
        user_id = cursor.lastrowid
        session['user_id']   = user_id
        session['user_name'] = name
        session['user_role'] = role

        return jsonify({'success': True, 'message': 'Registration successful.', 'user': {'id': user_id, 'name': name, 'role': role}})
    except Error as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/login', methods=['POST'])
def login():
    """Login with email and password."""
    data     = request.get_json()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        hashed = hash_password(password)
        cursor.execute(
            'SELECT id, name, email, role FROM users WHERE email = %s AND password = %s',
            (email, hashed)
        )
        user = cursor.fetchone()
        if not user:
            return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

        session['user_id']   = user['id']
        session['user_name'] = user['name']
        session['user_role'] = user['role']

        return jsonify({'success': True, 'user': user})
    finally:
        cursor.close()
        conn.close()


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out.'})


# =========================================
#  JOB ROUTES
# =========================================

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    """Get all active job listings with optional filters."""
    location = request.args.get('location', '')
    job_type = request.args.get('type', '')
    exp      = request.args.get('experience', '')
    search   = request.args.get('search', '')

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        query  = 'SELECT j.*, u.name AS company_name FROM jobs j JOIN users u ON j.employer_id = u.id WHERE j.is_active = 1'
        params = []

        if location:
            query += ' AND j.location = %s'
            params.append(location)
        if job_type:
            query += ' AND j.job_type = %s'
            params.append(job_type)
        if exp:
            query += ' AND j.experience = %s'
            params.append(exp)
        if search:
            query += ' AND (j.title LIKE %s OR j.skills LIKE %s OR u.name LIKE %s)'
            like = f'%{search}%'
            params.extend([like, like, like])

        query += ' ORDER BY j.created_at DESC'
        cursor.execute(query, params)
        jobs = cursor.fetchall()

        # Convert datetime to string
        for job in jobs:
            if isinstance(job.get('created_at'), datetime):
                job['created_at'] = job['created_at'].strftime('%d %b %Y')
            if isinstance(job.get('deadline'), datetime):
                job['deadline'] = job['deadline'].strftime('%d %b %Y')

        return jsonify({'success': True, 'jobs': jobs})
    finally:
        cursor.close()
        conn.close()


@app.route('/api/jobs', methods=['POST'])
def post_job():
    """Post a new job (employer only)."""
    if session.get('user_role') != 'employer':
        return jsonify({'success': False, 'message': 'Employer access required.'}), 403

    data = request.get_json()
    required = ['title', 'description', 'location', 'job_type', 'experience', 'skills']
    for field in required:
        if not data.get(field):
            return jsonify({'success': False, 'message': f'{field} is required.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor()
    try:
        cursor.execute(
            '''INSERT INTO jobs (employer_id, title, description, location, job_type,
               experience, salary_range, skills, department, deadline, is_active, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1, %s)''',
            (
                session['user_id'],
                data['title'], data['description'], data['location'],
                data['job_type'], data['experience'],
                data.get('salary_range', 'Competitive'),
                data['skills'], data.get('department', ''),
                data.get('deadline'), datetime.now()
            )
        )
        conn.commit()
        return jsonify({'success': True, 'message': 'Job posted successfully.', 'job_id': cursor.lastrowid})
    except Error as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/jobs/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Deactivate a job posting (employer only)."""
    if session.get('user_role') != 'employer':
        return jsonify({'success': False, 'message': 'Employer access required.'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor()
    try:
        cursor.execute(
            'UPDATE jobs SET is_active = 0 WHERE id = %s AND employer_id = %s',
            (job_id, session['user_id'])
        )
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'message': 'Job not found or access denied.'}), 404
        return jsonify({'success': True, 'message': 'Job removed.'})
    finally:
        cursor.close()
        conn.close()


# =========================================
#  APPLICATION ROUTES
# =========================================

@app.route('/api/applications', methods=['POST'])
def submit_application():
    """Submit a job application (seeker only)."""
    if session.get('user_role') != 'seeker':
        return jsonify({'success': False, 'message': 'Job seeker access required.'}), 403

    data   = request.get_json()
    job_id = data.get('job_id')
    if not job_id:
        return jsonify({'success': False, 'message': 'Job ID is required.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # Check duplicate application
        cursor.execute(
            'SELECT id FROM applications WHERE job_id = %s AND seeker_id = %s',
            (job_id, session['user_id'])
        )
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'You have already applied for this job.'}), 409

        cursor.execute(
            '''INSERT INTO applications (job_id, seeker_id, cover_letter, status, applied_at)
               VALUES (%s, %s, %s, 'pending', %s)''',
            (job_id, session['user_id'], data.get('cover_letter', ''), datetime.now())
        )
        conn.commit()
        return jsonify({'success': True, 'message': 'Application submitted successfully.', 'application_id': cursor.lastrowid})
    except Error as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/applications/my', methods=['GET'])
def get_my_applications():
    """Get all applications for the logged-in seeker."""
    if session.get('user_role') != 'seeker':
        return jsonify({'success': False, 'message': 'Job seeker access required.'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            '''SELECT a.*, j.title AS job_title, j.location, j.job_type,
               u.name AS company_name
               FROM applications a
               JOIN jobs j ON a.job_id = j.id
               JOIN users u ON j.employer_id = u.id
               WHERE a.seeker_id = %s
               ORDER BY a.applied_at DESC''',
            (session['user_id'],)
        )
        apps = cursor.fetchall()
        for app in apps:
            if isinstance(app.get('applied_at'), datetime):
                app['applied_at'] = app['applied_at'].strftime('%d %b %Y')
        return jsonify({'success': True, 'applications': apps})
    finally:
        cursor.close()
        conn.close()


@app.route('/api/applications/employer', methods=['GET'])
def get_employer_applications():
    """Get all applications for the employer's job postings."""
    if session.get('user_role') != 'employer':
        return jsonify({'success': False, 'message': 'Employer access required.'}), 403

    job_id = request.args.get('job_id')
    conn   = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        query  = '''SELECT a.*, j.title AS job_title,
                   u.name AS candidate_name, u.email AS candidate_email
                   FROM applications a
                   JOIN jobs j ON a.job_id = j.id
                   JOIN users u ON a.seeker_id = u.id
                   WHERE j.employer_id = %s'''
        params = [session['user_id']]

        if job_id:
            query  += ' AND a.job_id = %s'
            params.append(job_id)

        query += ' ORDER BY a.applied_at DESC'
        cursor.execute(query, params)
        apps = cursor.fetchall()
        for app in apps:
            if isinstance(app.get('applied_at'), datetime):
                app['applied_at'] = app['applied_at'].strftime('%d %b %Y')
        return jsonify({'success': True, 'applications': apps})
    finally:
        cursor.close()
        conn.close()


@app.route('/api/applications/<int:app_id>/status', methods=['PUT'])
def update_application_status(app_id):
    """Update application status: shortlisted / rejected / pending."""
    if session.get('user_role') != 'employer':
        return jsonify({'success': False, 'message': 'Employer access required.'}), 403

    data   = request.get_json()
    status = data.get('status')
    if status not in ('pending', 'shortlisted', 'rejected'):
        return jsonify({'success': False, 'message': 'Invalid status value.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor()
    try:
        cursor.execute(
            '''UPDATE applications a
               JOIN jobs j ON a.job_id = j.id
               SET a.status = %s
               WHERE a.id = %s AND j.employer_id = %s''',
            (status, app_id, session['user_id'])
        )
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'message': 'Application not found or access denied.'}), 404
        return jsonify({'success': True, 'message': f'Status updated to {status}.'})
    finally:
        cursor.close()
        conn.close()


@app.route('/api/applications/<int:app_id>', methods=['DELETE'])
def withdraw_application(app_id):
    """Withdraw an application (seeker only)."""
    if session.get('user_role') != 'seeker':
        return jsonify({'success': False, 'message': 'Job seeker access required.'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor()
    try:
        cursor.execute(
            'DELETE FROM applications WHERE id = %s AND seeker_id = %s',
            (app_id, session['user_id'])
        )
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'message': 'Application not found.'}), 404
        return jsonify({'success': True, 'message': 'Application withdrawn.'})
    finally:
        cursor.close()
        conn.close()


# =========================================
#  PROFILE ROUTES
# =========================================

@app.route('/api/profile', methods=['GET'])
def get_profile():
    """Get current user's profile."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated.'}), 401

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            'SELECT id, name, email, role, phone, location, title, skills, summary, linkedin, github, expected_salary, notice_period FROM users WHERE id = %s',
            (session['user_id'],)
        )
        user = cursor.fetchone()
        if not user:
            return jsonify({'success': False, 'message': 'User not found.'}), 404
        return jsonify({'success': True, 'profile': user})
    finally:
        cursor.close()
        conn.close()


@app.route('/api/profile', methods=['PUT'])
def update_profile():
    """Update current user's profile."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated.'}), 401

    data = request.get_json()
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor()
    try:
        cursor.execute(
            '''UPDATE users SET
               name = %s, phone = %s, location = %s, title = %s,
               skills = %s, summary = %s, linkedin = %s,
               github = %s, expected_salary = %s, notice_period = %s
               WHERE id = %s''',
            (
                data.get('name'), data.get('phone'), data.get('location'),
                data.get('title'), data.get('skills'), data.get('summary'),
                data.get('linkedin'), data.get('github'),
                data.get('expected_salary'), data.get('notice_period'),
                session['user_id']
            )
        )
        conn.commit()
        session['user_name'] = data.get('name', session['user_name'])
        return jsonify({'success': True, 'message': 'Profile updated successfully.'})
    except Error as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# =========================================
#  DASHBOARD STATS
# =========================================

@app.route('/api/stats/seeker', methods=['GET'])
def seeker_stats():
    """Get dashboard stats for job seeker."""
    if session.get('user_role') != 'seeker':
        return jsonify({'success': False, 'message': 'Access denied.'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('SELECT COUNT(*) AS total FROM applications WHERE seeker_id = %s', (session['user_id'],))
        total = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) AS shortlisted FROM applications WHERE seeker_id = %s AND status = 'shortlisted'", (session['user_id'],))
        shortlisted = cursor.fetchone()['shortlisted']

        return jsonify({'success': True, 'stats': {'total_applications': total, 'shortlisted': shortlisted}})
    finally:
        cursor.close()
        conn.close()


@app.route('/api/stats/employer', methods=['GET'])
def employer_stats():
    """Get dashboard stats for employer."""
    if session.get('user_role') != 'employer':
        return jsonify({'success': False, 'message': 'Access denied.'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('SELECT COUNT(*) AS active_jobs FROM jobs WHERE employer_id = %s AND is_active = 1', (session['user_id'],))
        active_jobs = cursor.fetchone()['active_jobs']

        cursor.execute(
            'SELECT COUNT(*) AS total FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = %s',
            (session['user_id'],)
        )
        total_apps = cursor.fetchone()['total']

        cursor.execute(
            "SELECT COUNT(*) AS shortlisted FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = %s AND a.status = 'shortlisted'",
            (session['user_id'],)
        )
        shortlisted = cursor.fetchone()['shortlisted']

        return jsonify({'success': True, 'stats': {'active_jobs': active_jobs, 'total_applications': total_apps, 'shortlisted': shortlisted}})
    finally:
        cursor.close()
        conn.close()


# =========================================
#  Run Server
# =========================================
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
