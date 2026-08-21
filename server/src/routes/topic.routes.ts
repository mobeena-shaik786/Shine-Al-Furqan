import { Request, Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import * as topicService from '../services/topic.service';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

router.use(protect);

router.get('/', async (req: Request, res, next) => {
  try {
    const query = topicService.listTopicsQuerySchema.parse(req.query);
    const topics = await topicService.listTopics(query);
    sendSuccess(res, topics, 'Topics retrieved');
  } catch (error) {
    next(error);
  }
});

router.post('/', authorizeRoles('admin', 'coordinator'), async (req: Request, res, next) => {
  try {
    const topic = await topicService.createTopic(req.body);
    sendSuccess(res, topic, 'Topic created', 201);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', authorizeRoles('admin', 'coordinator'), async (req: Request, res, next) => {
  try {
    const topic = await topicService.updateTopic(req.params.id, req.body);
    sendSuccess(res, topic, 'Topic updated');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authorizeRoles('admin', 'coordinator'), async (req: Request, res, next) => {
  try {
    await topicService.deleteTopic(req.params.id);
    sendSuccess(res, null, 'Topic deleted');
  } catch (error) {
    next(error);
  }
});

export default router;
