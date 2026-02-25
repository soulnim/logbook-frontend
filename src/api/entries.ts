import { client } from './client'
import type { Entry, CreateEntryRequest, UpdateEntryRequest } from '../types'

export const entriesApi = {
  getByDate: (date: string) =>
    client.get<Entry[]>(`/api/entries/date/${date}`).then(r => r.data),

  getByRange: (start: string, end: string) =>
    client.get<Entry[]>('/api/entries/range', { params: { start, end } }).then(r => r.data),

  getById: (id: number) =>
    client.get<Entry>(`/api/entries/${id}`).then(r => r.data),

  create: (data: CreateEntryRequest) =>
    client.post<Entry>('/api/entries', data).then(r => r.data),

  update: (id: number, data: UpdateEntryRequest) =>
    client.put<Entry>(`/api/entries/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    client.delete(`/api/entries/${id}`),

  search: (q: string) =>
    client.get<Entry[]>('/api/entries/search', { params: { q } }).then(r => r.data),
}