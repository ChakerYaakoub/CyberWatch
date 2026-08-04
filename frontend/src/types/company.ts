export interface Company {
  id: number
  name: string
  domain: string
  createdAt: string
  updatedAt: string
}

export interface CreateCompanyPayload {
  name: string
  domain: string
}
