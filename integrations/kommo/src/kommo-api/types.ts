/**
 * Kommo API Type Definitions
 *
 * These types match the actual Kommo API v4 structure.
 * Documentation: https://developers.kommo.com/reference/leads
 *

/**
 * KommoLead - What Kommo returns when you get a lead
 * This matches the actual API response structure
 * Source: https://developers.kommo.com/reference/get-lead
 */
export interface KommoLead {
  id: number
  name: string
  price: number
  responsible_user_id: number
  group_id: number
  status_id: number
  pipeline_id: number
  loss_reason_id: number | null
  created_by: number
  updated_by: number
  created_at: number  // Unix timestamp
  updated_at: number  
  closed_at: number | null
  closest_task_at: number | null
  is_deleted: boolean
  score: number | null
  account_id: number
  labor_cost: number | null
  is_price_computed: boolean

  // Custom fields (more complex than HubSpot properties)
  // Source: https://developers.kommo.com/reference/custom-fields
  custom_fields_values?: Array<{
    field_id: number
    field_name: string
    field_code?: string | null     // Optional - may not always be present
    field_type: string              // 'text', 'numeric', 'select', 'category', 'textarea', etc.
    values: Array<{
      value: string | number
      enum_id?: number              // For select/category fields with predefined options
    }>
  }>

  // Embedded relationships (contacts, companies, tags)
  _embedded?: {
    tags?: Array<{
      id: number
      name: string
    }>
    companies?: Array<{
      id: number
      _links: {
        self: {
          href: string
        }
      }
    }>
    contacts?: Array<{
      id: number
      is_main: boolean
      _links: {
        self: {
          href: string
        }
      }
    }>
  }

  // HATEOAS links
  _links?: {
    self: {
      href: string
    }
  }
}

/**
 * CreateLeadRequest - What to send when creating a lead
 * IMPORTANT: Kommo expects an ARRAY even for single lead!
 * Source: https://developers.kommo.com/reference/post-leads
 */
export interface CreateLeadRequest {
  name: string  // REQUIRED - only required field!
  price?: number
  responsible_user_id?: number
  pipeline_id?: number
  status_id?: number
  created_by?: number
  updated_by?: number
  created_at?: number
  updated_at?: number
  closed_at?: number

  // Custom fields
  custom_fields_values?: Array<{
    field_id: number
    values: Array<{
      value: string | number
    }>
  }>

  // Embedded data (tags, contacts, companies)
  _embedded?: {
    tags?: Array<{
      id?: number  // Existing tag ID
      name?: string  // Or new tag name
    }>
    contacts?: Array<{
      id: number
      is_main?: boolean
    }>
    companies?: Array<{
      id: number
    }>
  }
}

/**
 * UpdateLeadRequest - What to send when updating a lead
 * Source: https://developers.kommo.com/reference/patch-lead
 */
export interface UpdateLeadRequest {
  id?: number  // Required for update
  name?: string
  price?: number
  responsible_user_id?: number
  status_id?: number
  pipeline_id?: number
  custom_fields_values?: Array<{
    field_id: number
    values: Array<{
      value: string | number
    }>
  }>
}

/**
 * KommoCreateResponse - What Kommo returns after creating leads
 * IMPORTANT: Response contains _embedded.leads array
 * Source: https://developers.kommo.com/reference/post-leads
 */
export interface KommoCreateResponse {
  _links: {
    self: {
      href: string
    }
  }
  _embedded: {
    leads: Array<{
      id: number
      request_id: string  // Index of lead in request array
      _links: {
        self: {
          href: string
        }
      }
    }>
  }
}

/**
 * KommoGetResponse - What Kommo returns when getting a lead by ID
 * NOTE: Unlike the list endpoint, GET /leads/:id returns the lead directly,
 * not wrapped in _embedded.leads. The _embedded contains related data (tags, contacts, companies).
 * Source: https://developers.kommo.com/reference/get-lead
 */
export interface KommoGetResponse extends KommoLead {
  // The response IS the lead object itself
  // Inherits all KommoLead properties (id, name, price, etc.)
}

/**
 * KommoUpdateResponse - What Kommo returns after updating a lead
 * Same structure as GetResponse
 */
export interface KommoUpdateResponse {
  _links: {
    self: {
      href: string
    }
  }
  _embedded: {
    leads: KommoLead[]
  }
}

/**
 * KommoListResponse - What Kommo returns when listing leads
 * Source: https://developers.kommo.com/reference/get-leads
 */
export interface KommoListResponse {
  _page: number
  _links: {
    self: {
      href: string
    }
    next?: {
      href: string
    }
  }
  _embedded: {
    leads: KommoLead[]
  }
}

/**
 * Generic wrapper for Kommo API responses
 * Used for axios response typing
 */
export interface KommoApiResponse<T> {
  _embedded: {
    leads: T[]
  }
  _links?: {
    self: {
      href: string
    }
    next?: {
      href: string
    }
  }
}

/**
 * Kommo API Error Response
 * Source: https://developers.kommo.com/docs/error-codes
 */
export interface KommoErrorResponse {
  title: string
  type: string
  status: number
  detail: string
  validation_errors?: Array<{
    request_id: string
    errors: Array<{
      code: string
      path: string
      detail: string
    }>
  }>
}
