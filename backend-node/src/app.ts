import express, { Express } from 'express';
import cors from 'cors';
import { customerRoutes } from './modules/customer/customer.routes';
import { leadRoutes } from './modules/lead/lead.routes';
import { opportunityRoutes } from './modules/opportunity/opportunity.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { setupSwagger } from './config/swagger';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Swagger Documentation at /api/docs
  setupSwagger(app);

  // Root endpoint: Redirect to Swagger UI or return API Info
  app.get('/', (req, res) => {
    // If accessed via browser, redirect to Swagger Docs
    if (req.accepts('html')) {
      return res.redirect('/api/docs');
    }
    return res.status(200).json({
      success: true,
      message: 'CRM Sales Opportunity & Customer Management Backend API is running',
      documentation: '/api/docs',
      health: '/health',
      endpoints: {
        customerCareList: 'GET /api/customers/care?days=30&page=1&limit=20',
        customerCareContact: 'PATCH /api/customers/:customerId/care/contact',
        createLead: 'POST /api/leads (hoặc POST /leads)',
        previewImport: 'POST /api/leads/import/preview (hoặc POST /leads/import/preview)',
        importLeads: 'POST /api/leads/import (hoặc POST /leads/import)',
        listLeads: 'GET /api/leads (hoặc GET /leads)',
        convertLead: 'POST /api/leads/:id/convert (hoặc POST /leads/:id/convert)',
        createOpportunity: 'POST /api/opportunities (hoặc POST /opportunities)',
        listOpportunities: 'GET /api/opportunities (hoặc GET /opportunities)',
        getOpportunityDetail: 'GET /api/opportunities/:id (hoặc GET /opportunities/:id)',
        updateOpportunity: 'PATCH /api/opportunities/:id (hoặc PATCH /opportunities/:id)',
        updateOpportunityStage: 'PATCH /api/opportunities/:id/stage (hoặc PATCH /opportunities/:id/stage)',
      },
    });
  });

  // Health Check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Application Routes
  app.use('/api/customers', customerRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/leads', leadRoutes);
  app.use('/api/opportunities', opportunityRoutes);
  app.use('/opportunities', opportunityRoutes);


  // 404 Handler for undefined routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} không tồn tại`,
        details: null,
      },
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
