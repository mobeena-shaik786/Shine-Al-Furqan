import { Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import * as leadService from '../services/lead.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  createLeadSchema,
  listLeadsQuerySchema,
  updateLeadSchema,
} from '../validators/lead.validator';

const router = Router();
router.use(protect, authorizeRoles('admin', 'coordinator'));

router.get('/', async (req, res, next) => {
  try {
    const query = listLeadsQuerySchema.parse(req.query);
    const result = await leadService.listLeads(query);
    sendSuccess(res, result.leads, 'Leads retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const input = createLeadSchema.parse(req.body);
    const lead = await leadService.createLead(input, req.user!.id);
    sendSuccess(res, lead, 'Lead created', 201);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const input = updateLeadSchema.parse(req.body);
    const lead = await leadService.updateLead(req.params.id, input);
    sendSuccess(res, lead, 'Lead updated');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await leadService.deleteLead(req.params.id);
    sendSuccess(res, null, 'Lead deleted');
  } catch (error) {
    next(error);
  }
});

export default router;
