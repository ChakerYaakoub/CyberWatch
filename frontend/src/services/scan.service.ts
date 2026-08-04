import type { CreateScanPayload, Scan } from '../types'
import { api, unwrapData } from './api'

export async function getScans(): Promise<Scan[]> {
  const scans = await unwrapData<Scan[]>(api.get('/scans'))
  return scans.map(normalizeScan)
}

export async function getScan(id: number): Promise<Scan> {
  const scan = await unwrapData<Scan>(api.get(`/scans/${id}`))
  return normalizeScan(scan)
}

export async function createScan(payload: CreateScanPayload): Promise<Scan> {
  const scan = await unwrapData<Scan>(api.post('/scans', payload))
  return normalizeScan(scan)
}

function normalizeScan(scan: Scan): Scan {
  return {
    ...scan,
    vulnerabilities: scan.vulnerabilities ?? [],
  }
}
