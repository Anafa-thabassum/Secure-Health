backend/
├── config/
│   ├── database.js
│   ├── redis.js
│   └── security.js
│
├── models/
│   ├── User.js
│   ├── Patient.js
│   ├── ClinicalRecord.js
│   ├── Consent.js
│   └── AuditEvent.js
│
├── middleware/
│   ├── authenticate.js
│   ├── validateRequest.js
│   ├── rateLimiter.js
│   └── errorHandler.js
│
├── services/
│   └── authService.js
│
├── controllers/
│   └── authController.js
│
├── routes/
│   └── authRoutes.js
│
├── utils/
│   ├── hash.js
│   ├── token.js
│   └── validators.js
│
└── tests/
    └── auth/