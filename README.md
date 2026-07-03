# Gov & Org Complaint Management System (CMS)

A complete, production-ready, secure, and AI-enabled **Complaint Management System** built with **Spring Boot 3 (Java 17)** and **React 19 (Vite)**.

---

## Technical Stack

### Frontend
* **Core**: React 19, Vite, React Router
* **Styling**: Material UI, Tailwind CSS, Framer Motion
* **State & Query**: Redux Toolkit, TanStack React Query, Axios Client
* **Graphics & Maps**: Recharts, Leaflet Maps, QRCode.react

### Backend
* **Core**: Java 17, Spring Boot 3.3.4, Maven
* **Database**: MySQL 8 (Data JPA / Hibernate)
* **Security**: Spring Security 6, JWT, BCrypt
* **Third-Party**: Cloudinary API, Java Mail Sender (Brevo SMTP integration)

---

## Directory Structure

```
complaintmanagementsystem/
├── README.md
├── backend/                  # Spring Boot Maven application
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/cms/      # Java Source code (Entities, Services, Controllers)
│       │   └── resources/         # application.yml config
└── frontend/                 # Vite React application
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── components/            # Reusable UI & Chatbot
        ├── pages/                 # Role-based dashboards & auth pages
        └── services/              # Axios API clients
```

---

## Local Development Configuration

### 1. Database Initialization (MySQL)
Create a new MySQL schema:
```sql
CREATE DATABASE cms;
```

Execute the following DML query to seed default values for testing:
```sql
-- Seed Departments
INSERT INTO departments (id, name, code, description, created_at, updated_at) VALUES 
(1, 'Water Department', 'WT', 'Water supply leakages, pipe repairs and sewage blockages.', NOW(), NOW()),
(2, 'Road & Highways', 'RD', 'Road potholes, surface crackings and highway blockages.', NOW(), NOW()),
(3, 'Electricity Department', 'EL', 'Power outages, transformer sparks and streetlight issues.', NOW(), NOW()),
(4, 'Sanitation Department', 'SN', 'Garbage collection bins and public cleaning operations.', NOW(), NOW()),
(5, 'Police Department', 'PL', 'Safety patrols, theft and local crime reporting.', NOW(), NOW());

-- Seed Users (Password for all accounts: admin123)
-- BCrypt hash for admin123: $2a$10$X87Xv6YspvT5yXfD6O4G1Oa27V.9e.17k7N/3jOcrfVz73m/QWk1.
INSERT INTO users (id, username, password, email, full_name, phone_number, role, status, email_verified, created_at, updated_at) VALUES 
(1, 'admin', '$2a$10$X87Xv6YspvT5yXfD6O4G1Oa27V.9e.17k7N/3jOcrfVz73m/QWk1.', 'admin@cms.com', 'Super Admin', '1234567890', 'ROLE_ADMIN', 'ACTIVE', true, NOW(), NOW()),
(2, 'citizen', '$2a$10$X87Xv6YspvT5yXfD6O4G1Oa27V.9e.17k7N/3jOcrfVz73m/QWk1.', 'citizen@cms.com', 'Jane Citizen', '0987654321', 'ROLE_CITIZEN', 'ACTIVE', true, NOW(), NOW()),
(3, 'head_wt', '$2a$10$X87Xv6YspvT5yXfD6O4G1Oa27V.9e.17k7N/3jOcrfVz73m/QWk1.', 'head_wt@cms.com', 'David Department Head', '5556667777', 'ROLE_DEPT_HEAD', 'ACTIVE', true, NOW(), NOW()),
(4, 'officer_wt', '$2a$10$X87Xv6YspvT5yXfD6O4G1Oa27V.9e.17k7N/3jOcrfVz73m/QWk1.', 'officer_wt@cms.com', 'John Officer', '4445556666', 'ROLE_OFFICER', 'ACTIVE', true, NOW(), NOW());

-- Map Officers & Heads to Departments
INSERT INTO officers (id, user_id, department_id, designation, created_at, updated_at) VALUES 
(1, 3, 1, 'Chief Superintendent (Water)', NOW(), NOW()),
(2, 4, 1, 'Junior Water Field Engineer', NOW(), NOW());
```

### 2. Spring Boot Setup
Configure environment variables in your environment or populate in `backend/src/main/resources/application.yml`:
```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=cms
export DB_USER=root
export DB_PASSWORD=yourpassword

# SMTP Mail Server (Brevo / Gmail)
export SPRING_MAIL_HOST=smtp.brevo.com
export SPRING_MAIL_PORT=587
export SPRING_MAIL_USERNAME=your_brevo_account_email
export SPRING_MAIL_PASSWORD=your_smtp_key

# Cloudinary Integration (Free Tier API Credentials)
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret
```

Compile and launch:
```bash
cd backend
mvn spring-boot:run
```

### 3. Vite React Setup
Launch local development server:
```bash
cd frontend
npm install
npm run dev
```

Open Browser at: [http://localhost:5173](http://localhost:5173)

---

## API Endpoints List

### 1. Authentication
* `POST /api/auth/register` - Create new citizen profile
* `POST /api/auth/login` - Authenticate credentials, returns JWT token details
* `GET /api/auth/verify-email?token=XYZ` - Verify email address
* `POST /api/auth/forgot-password` - Requests reset credentials token
* `POST /api/auth/reset-password?token=XYZ` - Update password

### 2. Complaints Management
* `POST /api/complaints` - Multipart upload endpoint to file complaint (with title, description, department, and attachments)
* `GET /api/complaints` - Query complaints page list
* `GET /api/complaints/{id}` - Read single complaint details
* `GET /api/complaints/{id}/timeline` - Read timeline history logs
* `PUT /api/complaints/{id}/assign?officerId=XYZ` - Assign complaint to department staff
* `PUT /api/complaints/{id}/status` - Update complaint status (ACCEPTED, IN_PROGRESS, RESOLVED)
* `PUT /api/complaints/{id}/transfer?targetDeptId=ABC&remarks=DEF` - Transfer ticket to another department

### 3. Department & User Admin
* `GET /api/departments` - List departments
* `POST /api/departments` - Create new department
* `GET /api/users` - View users list
* `POST /api/users/officers` - Create officer from user
* `GET /api/users/audit-logs` - Read audit security trails

---

## Verification checklist
1. **Dark/Light Mode**: Use the sun/moon button in the navbar.
2. **AI Categorization**: File a complaint with keywords like "pipe leakage". It automatically maps to "Water Department" (prefix `WT-`).
3. **Offline drafts**: Turn off WiFi or set browser DevTools to Offline, draft a complaint, verify it logs to drafts list, go online, and click sync to publish.
