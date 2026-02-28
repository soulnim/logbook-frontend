import { client } from './client'
import type {
  Goal, CreateGoalRequest, UpdateGoalRequest,
  CreateMilestoneRequest, UpdateMilestoneRequest, GoalSummary,
} from '../types'

export const goalsApi = {
  // Goals
  getAll:    (status?: string) =>
    client.get<Goal[]>('/api/goals', { params: status ? { status } : {} }).then(r => r.data),

  getOne:    (id: number) =>
    client.get<Goal>(`/api/goals/${id}`).then(r => r.data),

  getSummary: () =>
    client.get<GoalSummary>('/api/goals/summary').then(r => r.data),

  create: (req: CreateGoalRequest) =>
    client.post<Goal>('/api/goals', req).then(r => r.data),

  update: (id: number, req: UpdateGoalRequest) =>
    client.put<Goal>(`/api/goals/${id}`, req).then(r => r.data),

  updateStatus: (id: number, status: string) =>
    client.patch<Goal>(`/api/goals/${id}/status`, { status }).then(r => r.data),

  delete: (id: number) =>
    client.delete(`/api/goals/${id}`),

  // Milestones
  addMilestone: (goalId: number, req: CreateMilestoneRequest) =>
    client.post<Goal>(`/api/goals/${goalId}/milestones`, req).then(r => r.data),

  updateMilestone: (goalId: number, milestoneId: number, req: UpdateMilestoneRequest) =>
    client.patch<Goal>(`/api/goals/${goalId}/milestones/${milestoneId}`, req).then(r => r.data),

  deleteMilestone: (goalId: number, milestoneId: number) =>
    client.delete<Goal>(`/api/goals/${goalId}/milestones/${milestoneId}`).then(r => r.data),
}