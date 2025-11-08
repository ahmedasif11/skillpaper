# SkillPaper Backend API

A professional resume builder backend service built with Node.js, Express, TypeScript, and MongoDB. This service provides RESTful APIs for creating, managing, and generating PDF resumes from customizable templates.

## 🚀 Features

- **Template Management**: Create, read, update, and delete resume templates
- **Resume CRUD Operations**: Full lifecycle management of user resumes
- **PDF Generation**: Convert HTML templates to professional PDF resumes using Puppeteer
- **Authentication**: JWT-based user authentication and authorization
- **Data Validation**: Comprehensive input validation using Joi
- **Database Integration**: MongoDB with Mongoose ODM
- **Template Engine**: Handlebars for dynamic content rendering
- **File Management**: Automatic cleanup of generated PDF files

## 🏗️ Architecture

### Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── data/           # Sample templates and data
│   ├── middlewares/    # Custom middleware functions
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API route definitions
│   ├── scripts/        # Utility scripts
│   ├── services/       # Business logic services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Helper utilities
│   └── validation/     # Input validation schemas
├── dist/               # Compiled JavaScript output
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

### Core Components

#### 1. **Models** (`src/models/`)

- **User.ts**: User authentication and profile data
- **Resume.ts**: Resume document structure and metadata
- **Template.ts**: Resume template definitions

#### 2. **Controllers** (`src/controllers/`)

- **auth.controller.ts**: User registration, login, and authentication
- **resume.controller.ts**: Resume CRUD operations and PDF generation
- **template.controller.ts**: Template management operations

#### 3. **Services** (`src/services/`)

- **pdf.service.ts**: PDF generation using Puppeteer and Handlebars

#### 4. **Routes** (`src/routes/`)

- **auth.routes.ts**: Authentication endpoints
- **resume.routes.ts**: Resume management endpoints
- **template.routes.ts**: Template management endpoints

## 🔧 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd skillpaper/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend root directory:

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/skillpaper
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

5. **Seed the database** (optional)

   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jacqueline Thompson",
  "email": "jacqueline.thompson@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_id_here",
    "name": "Jacqueline Thompson",
    "email": "jacqueline.thompson@example.com"
  },
  "token": "jwt_token_here"
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "jacqueline.thompson@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id_here",
    "name": "Jacqueline Thompson",
    "email": "jacqueline.thompson@example.com"
  },
  "token": "jwt_token_here"
}
```

### Template Endpoints

#### Get All Templates

```http
GET /api/templates
```

**Response:**

```json
{
  "success": true,
  "templates": [
    {
      "_id": "template_id_1",
      "name": "Jacqueline Thompson Professional",
      "preview": "/templates/default-template.svg",
      "html": "<!DOCTYPE html>...",
      "createdAt": "2025-01-27T10:00:00.000Z",
      "updatedAt": "2025-01-27T10:00:00.000Z"
    },
    {
      "_id": "template_id_2",
      "name": "ATS-Friendly Professional",
      "preview": "/templates/default-template.svg",
      "html": "<!DOCTYPE html>...",
      "createdAt": "2025-01-27T10:00:00.000Z",
      "updatedAt": "2025-01-27T10:00:00.000Z"
    }
  ]
}
```

#### Get Template by ID

```http
GET /api/templates/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "template": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Jacqueline Thompson Professional",
    "preview": "/templates/default-template.svg",
    "html": "<!DOCTYPE html>...",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T10:00:00.000Z"
  }
}
```

#### Create Template (Admin)

```http
POST /api/templates
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Custom Professional Template",
  "preview": "/templates/custom.svg",
  "html": "<!DOCTYPE html><html><head><title>{{name}} - Resume</title></head><body><h1>{{name}}</h1><p>{{summary}}</p></body></html>"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Template created successfully",
  "template": {
    "_id": "new_template_id",
    "name": "Custom Professional Template",
    "preview": "/templates/custom.svg",
    "html": "<!DOCTYPE html>...",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T10:00:00.000Z"
  }
}
```

### Resume Endpoints

#### Create Resume

```http
POST /api/resumes
Content-Type: application/json
Authorization: Bearer <token>

{
  "templateId": "507f1f77bcf86cd799439011",
  "data": {
    "name": "Jacqueline Thompson",
    "summary": "Results-oriented Engineering Executive with a proven track record of optimizing project outcomes. Skilled in strategic project management and team leadership. Seeking a challenging executive role to leverage technical expertise and drive engineering excellence.",
    "location": "123 Anywhere St., Any City",
    "phone": "123-456-7890",
    "email": "hello@reallygreatsite.com",
    "website": "www.reallygreatsite.com",
    "education": [
      {
        "degree": "Master of Science in Mechanical Engineering",
        "institution": "University of Engineering and Technology",
        "year": "Sep 2019 - Oct 2020",
        "achievements": [
          "Specialization in Advanced Manufacturing.",
          "Thesis on \"Innovations in Sustainable Engineering Practices\"."
        ]
      },
      {
        "degree": "Bachelor of Science in Civil Engineering",
        "institution": "City College of Engineering",
        "year": "Aug 2015 - Aug 2019",
        "achievements": [
          "Relevant coursework in Structural Design and Project Management."
        ]
      }
    ],
    "experience": [
      {
        "company": "Borcelle Technologies",
        "position": "Engineering Executive",
        "duration": "Jan 2023 - Present",
        "responsibilities": [
          "Implemented cost-effective solutions, resulting in a 20% reduction in project expenses.",
          "Streamlined project workflows, enhancing overall efficiency by 25%.",
          "Led a team in successfully delivering a complex engineering project on time and within allocated budget."
        ]
      },
      {
        "company": "Salford & Co",
        "position": "Project Engineer",
        "duration": "Mar 2021 - Dec 2022",
        "responsibilities": [
          "Managed project timelines, reducing delivery times by 30%.",
          "Spearheaded the adoption of cutting-edge engineering software, improving project accuracy by 15%.",
          "Collaborated with cross-functional teams, enhancing project success rates by 10%."
        ]
      },
      {
        "company": "Arowwai Industries",
        "position": "Graduate Engineer",
        "duration": "Feb 2020 - Jan 2021",
        "responsibilities": [
          "Coordinated project tasks, ensuring adherence to engineering standards and regulations.",
          "Conducted comprehensive project analyses, identifying and rectifying discrepancies in engineering designs."
        ]
      }
    ],
    "technicalSkills": "Project Management, Structural Analysis, Robotics and Automation, CAD",
    "languagesString": "English, Malay, German",
    "certifications": "Professional Engineer (PE) License, Project Management Professional (PMP)",
    "additionalInfo": [
      "Received the \"Engineering Excellence\" Award for outstanding contributions to project innovation, Borcelle Technologies"
    ]
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Resume created successfully",
  "resume": {
    "_id": "resume_id_here",
    "user": "user_id_here",
    "template": "507f1f77bcf86cd799439011",
    "data": {
      "name": "Jacqueline Thompson",
      "summary": "Results-oriented Engineering Executive...",
      "location": "123 Anywhere St., Any City",
      "phone": "123-456-7890",
      "email": "hello@reallygreatsite.com",
      "website": "www.reallygreatsite.com",
      "education": [...],
      "experience": [...],
      "technicalSkills": "Project Management, Structural Analysis, Robotics and Automation, CAD",
      "languagesString": "English, Malay, German",
      "certifications": "Professional Engineer (PE) License, Project Management Professional (PMP)",
      "additionalInfo": [...]
    },
    "pdfUrl": null,
    "isPublic": false,
    "shareToken": null,
    "shareExpiresAt": null,
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T10:00:00.000Z"
  }
}
```

#### Get User Resumes

```http
GET /api/resumes/user
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "resumes": [
    {
      "_id": "resume_id_1",
      "user": "user_id_here",
      "template": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Jacqueline Thompson Professional"
      },
      "data": {
        "name": "Jacqueline Thompson",
        "summary": "Results-oriented Engineering Executive...",
        "location": "123 Anywhere St., Any City",
        "phone": "123-456-7890",
        "email": "hello@reallygreatsite.com"
      },
      "pdfUrl": "/uploads/resume_123.pdf",
      "isPublic": false,
      "createdAt": "2025-01-27T10:00:00.000Z",
      "updatedAt": "2025-01-27T10:00:00.000Z"
    }
  ]
}
```

#### Get Resume by ID

```http
GET /api/resumes/507f1f77bcf86cd799439012
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "resume": {
    "_id": "507f1f77bcf86cd799439012",
    "user": "user_id_here",
    "template": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jacqueline Thompson Professional",
      "html": "<!DOCTYPE html>..."
    },
    "data": {
      "name": "Jacqueline Thompson",
      "summary": "Results-oriented Engineering Executive...",
      "location": "123 Anywhere St., Any City",
      "phone": "123-456-7890",
      "email": "hello@reallygreatsite.com",
      "website": "www.reallygreatsite.com",
      "education": [...],
      "experience": [...],
      "technicalSkills": "Project Management, Structural Analysis, Robotics and Automation, CAD",
      "languagesString": "English, Malay, German",
      "certifications": "Professional Engineer (PE) License, Project Management Professional (PMP)",
      "additionalInfo": [...]
    },
    "pdfUrl": "/uploads/resume_123.pdf",
    "isPublic": false,
    "shareToken": null,
    "shareExpiresAt": null,
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T10:00:00.000Z"
  }
}
```

#### Update Resume

```http
PUT /api/resumes/507f1f77bcf86cd799439012
Content-Type: application/json
Authorization: Bearer <token>

{
  "data": {
    "name": "Jacqueline Thompson",
    "summary": "Updated: Results-oriented Engineering Executive with extensive experience in project optimization and team leadership.",
    "phone": "123-456-7891",
    "additionalInfo": [
      "Received the \"Engineering Excellence\" Award for outstanding contributions to project innovation, Borcelle Technologies",
      "Certified in Advanced Project Management methodologies"
    ]
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Resume updated successfully",
  "resume": {
    "_id": "507f1f77bcf86cd799439012",
    "user": "user_id_here",
    "template": "507f1f77bcf86cd799439011",
    "data": {
      "name": "Jacqueline Thompson",
      "summary": "Updated: Results-oriented Engineering Executive...",
      "location": "123 Anywhere St., Any City",
      "phone": "123-456-7891",
      "email": "hello@reallygreatsite.com",
      "website": "www.reallygreatsite.com",
      "education": [...],
      "experience": [...],
      "technicalSkills": "Project Management, Structural Analysis, Robotics and Automation, CAD",
      "languagesString": "English, Malay, German",
      "certifications": "Professional Engineer (PE) License, Project Management Professional (PMP)",
      "additionalInfo": [
        "Received the \"Engineering Excellence\" Award for outstanding contributions to project innovation, Borcelle Technologies",
        "Certified in Advanced Project Management methodologies"
      ]
    },
    "pdfUrl": "/uploads/resume_123.pdf",
    "isPublic": false,
    "shareToken": null,
    "shareExpiresAt": null,
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T10:05:00.000Z"
  }
}
```

#### Download Resume PDF

```http
GET /api/resumes/507f1f77bcf86cd799439012/download
Authorization: Bearer <token>
```

**Response:** Binary PDF file download

#### Generate Resume Preview

```http
GET /api/resumes/507f1f77bcf86cd799439012/preview
Authorization: Bearer <token>
```

**Response:** HTML preview of the resume

#### Share Resume

```http
POST /api/resumes/507f1f77bcf86cd799439012/share
Content-Type: application/json
Authorization: Bearer <token>

{
  "expiresInDays": 30
}
```

**Response:**

```json
{
  "success": true,
  "message": "Resume shared successfully",
  "shareToken": "abc123def456ghi789",
  "shareUrl": "http://localhost:5000/api/resumes/public/abc123def456ghi789",
  "expiresAt": "2025-02-26T10:00:00.000Z"
}
```

#### Access Shared Resume (Public)

```http
GET /api/resumes/public/abc123def456ghi789
```

**Response:** HTML preview of the shared resume (no authentication required)

## 🧪 Testing the API

### Complete Testing Workflow

Here's a step-by-step guide to test all endpoints with the Jacqueline Thompson sample data:

#### 1. Start the Server

   ```bash
cd backend
   npm run dev
   ```

#### 2. Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jacqueline Thompson",
    "email": "jacqueline.thompson@example.com",
    "password": "securepassword123"
  }'
```

#### 3. Login to Get Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jacqueline.thompson@example.com",
    "password": "securepassword123"
  }'
```

**Save the token from the response for the next steps.**

#### 4. Get Available Templates

```bash
curl -X GET http://localhost:5000/api/templates
```

#### 5. Create a Resume

```bash
curl -X POST http://localhost:5000/api/resumes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "templateId": "TEMPLATE_ID_FROM_STEP_4",
    "data": {
      "name": "Jacqueline Thompson",
      "summary": "Results-oriented Engineering Executive with a proven track record of optimizing project outcomes. Skilled in strategic project management and team leadership. Seeking a challenging executive role to leverage technical expertise and drive engineering excellence.",
      "location": "123 Anywhere St., Any City",
      "phone": "123-456-7890",
      "email": "hello@reallygreatsite.com",
      "website": "www.reallygreatsite.com",
      "education": [
        {
          "degree": "Master of Science in Mechanical Engineering",
          "institution": "University of Engineering and Technology",
          "year": "Sep 2019 - Oct 2020",
          "achievements": [
            "Specialization in Advanced Manufacturing.",
            "Thesis on \"Innovations in Sustainable Engineering Practices\"."
          ]
        },
        {
          "degree": "Bachelor of Science in Civil Engineering",
          "institution": "City College of Engineering",
          "year": "Aug 2015 - Aug 2019",
          "achievements": [
            "Relevant coursework in Structural Design and Project Management."
          ]
        }
      ],
      "experience": [
        {
          "company": "Borcelle Technologies",
          "position": "Engineering Executive",
          "duration": "Jan 2023 - Present",
          "responsibilities": [
            "Implemented cost-effective solutions, resulting in a 20% reduction in project expenses.",
            "Streamlined project workflows, enhancing overall efficiency by 25%.",
            "Led a team in successfully delivering a complex engineering project on time and within allocated budget."
          ]
        },
        {
          "company": "Salford & Co",
          "position": "Project Engineer",
          "duration": "Mar 2021 - Dec 2022",
          "responsibilities": [
            "Managed project timelines, reducing delivery times by 30%.",
            "Spearheaded the adoption of cutting-edge engineering software, improving project accuracy by 15%.",
            "Collaborated with cross-functional teams, enhancing project success rates by 10%."
          ]
        },
        {
          "company": "Arowwai Industries",
          "position": "Graduate Engineer",
          "duration": "Feb 2020 - Jan 2021",
          "responsibilities": [
            "Coordinated project tasks, ensuring adherence to engineering standards and regulations.",
            "Conducted comprehensive project analyses, identifying and rectifying discrepancies in engineering designs."
          ]
        }
      ],
      "technicalSkills": "Project Management, Structural Analysis, Robotics and Automation, CAD",
      "languagesString": "English, Malay, German",
      "certifications": "Professional Engineer (PE) License, Project Management Professional (PMP)",
      "additionalInfo": [
        "Received the \"Engineering Excellence\" Award for outstanding contributions to project innovation, Borcelle Technologies"
      ]
    }
  }'
```

#### 6. Get User Resumes

```bash
curl -X GET http://localhost:5000/api/resumes/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 7. Get Specific Resume

```bash
curl -X GET http://localhost:5000/api/resumes/RESUME_ID_FROM_STEP_5 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 8. Update Resume

```bash
curl -X PUT http://localhost:5000/api/resumes/RESUME_ID_FROM_STEP_5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "data": {
      "summary": "Updated: Results-oriented Engineering Executive with extensive experience in project optimization and team leadership.",
      "phone": "123-456-7891",
      "additionalInfo": [
        "Received the \"Engineering Excellence\" Award for outstanding contributions to project innovation, Borcelle Technologies",
        "Certified in Advanced Project Management methodologies"
      ]
    }
  }'
```

#### 9. Generate Resume Preview

```bash
curl -X GET http://localhost:5000/api/resumes/RESUME_ID_FROM_STEP_5/preview \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 10. Download Resume PDF

```bash
curl -X GET http://localhost:5000/api/resumes/RESUME_ID_FROM_STEP_5/download \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  --output jacqueline-resume.pdf
```

#### 11. Share Resume

```bash
curl -X POST http://localhost:5000/api/resumes/RESUME_ID_FROM_STEP_5/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "expiresInDays": 30
  }'
```

#### 12. Access Shared Resume (Public)

```bash
curl -X GET http://localhost:5000/api/resumes/public/SHARE_TOKEN_FROM_STEP_11
```

### Expected Results

- **Registration/Login**: Should return user data and JWT token
- **Templates**: Should return available templates including "Jacqueline Thompson Professional"
- **Resume Creation**: Should create resume with all provided data
- **PDF Generation**: Should generate a professional PDF (~100KB)
- **Preview**: Should return HTML with styled resume
- **Sharing**: Should create public access link

### Testing with Postman

Import this collection for easy testing:

```json
{
  "info": {
    "name": "SkillPaper API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Jacqueline Thompson\",\n  \"email\": \"jacqueline.thompson@example.com\",\n  \"password\": \"securepassword123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"jacqueline.thompson@example.com\",\n  \"password\": \"securepassword123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    }
  ]
}
```

## 🎨 Template System

### Template Structure

Templates are HTML documents with Handlebars placeholders for dynamic content:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>{{name}} - Resume</title>
    <style>
      /* CSS styles */
    </style>
  </head>
  <body>
    <h1>{{name}}</h1>
    <p>{{summary}}</p>

    {{#if experience}}
    <section>
      <h2>Experience</h2>
      {{#each experience}}
      <div>
        <h3>{{position}} at {{company}}</h3>
        <p>{{duration}}</p>
        <ul>
          {{#each responsibilities}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
      </div>
      {{/each}}
    </section>
    {{/if}}
  </body>
</html>
```

### Available Template Variables

- **Personal Info**: `name`, `email`, `phone`, `location`, `website`, `linkedin`
- **Professional**: `title`, `tagline`, `summary`
- **Experience**: `experience` array with `company`, `position`, `duration`, `responsibilities`
- **Education**: `education` array with `degree`, `institution`, `year`, `achievements`
- **Skills**: `technicalSkills`, `tools`, `languagesString`
- **Additional**: `achievements`, `certifications`, `additionalInfo`

### Template Types

1. **ATS-Friendly Professional**: Optimized for Applicant Tracking Systems
2. **Jacqueline Thompson Professional**: Modern design with purple accent colors

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Comprehensive validation using Joi schemas
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Controlled cross-origin requests
- **File Size Limits**: Protection against large file uploads

## 📊 Database Schema

### User Model

```typescript
{
  name: string;
  email: string(unique);
  password: string(hashed);
  createdAt: Date;
  updatedAt: Date;
}
```

### Resume Model

```typescript
{
  user: ObjectId (ref: User);
  template: ObjectId (ref: Template);
  data: Object; // Resume content
  pdfUrl?: string;
  isPublic?: boolean;
  shareToken?: string;
  shareExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Template Model

```typescript
{
  name: string;
  preview: string; // Image URL
  html: string; // Handlebars template
  createdAt: Date;
  updatedAt: Date;
}
```

## 🛠️ Development

### Available Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Start development server with hot reload
- `npm start`: Start production server
- `npm run seed`: Populate database with sample data

### Code Quality

- **TypeScript**: Full type safety and IntelliSense support
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting
- **Error Handling**: Comprehensive error handling and logging

### Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Build

   ```bash
npm run build
   npm start
   ```

### Environment Variables (Production)

```env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/skillpaper
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Performance & Monitoring

### PDF Generation Optimization

- **Puppeteer Configuration**: Optimized for server environments
- **Memory Management**: Automatic browser cleanup
- **File Cleanup**: Automatic removal of old PDF files
- **Caching**: Template compilation caching

### Monitoring

- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Request timing and resource usage
- **Health Checks**: API health monitoring endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the API documentation for endpoint details

## 🔄 Changelog

### Version 1.0.0

- Initial release
- Template management system
- Resume CRUD operations
- PDF generation with Puppeteer
- JWT authentication
- MongoDB integration
- ATS-friendly templates

---

**Built with ❤️ using Node.js, Express, TypeScript, and MongoDB**
