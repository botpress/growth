import * as bp from '.botpress'
import { v2 } from 'pipedrive'
import { getApiConfig } from '../auth'
import { DealSearchFields } from '../types'

export const createDeal: bp.IntegrationProps['actions']['createDeal'] = async ({ ctx, input }) => {
    try {
        const dealsApi = new v2.DealsApi(await getApiConfig({ ctx }))
        const { 
            title, value, currency, person_id, 
            org_id, pipeline_id, stage_id, 
            expected_close_date, visible_to } = input
    
        const newDealRequest: v2.AddDealRequest = {
            title,
            ...(value !== undefined && { value }),
            ...(currency !== undefined && { currency }),
            ...(person_id !== undefined && { person_id }),
            ...(org_id !== undefined && { org_id }),
            ...(pipeline_id !== undefined && { pipeline_id }),
            ...(stage_id !== undefined && { stage_id }),
            ...(expected_close_date !== undefined && { expected_close_date }),
            ...(visible_to !== undefined && { visible_to })
        }
    
        const req: v2.DealsApiAddDealRequest = { AddDealRequest: newDealRequest }
        const res = await dealsApi.addDeal(req)
    
        return { deal: res.data }
    } catch (error) {
        console.error(error)
        throw new Error(`Failed to create deal: ${error}`)
    }
}

export const updateDeal: bp.IntegrationProps['actions']['updateDeal'] = async ({ ctx, input }) => {
    try {
        const dealsApi = new v2.DealsApi(await getApiConfig({ ctx }))
        const { deal_id, title, value, 
            currency, person_id, org_id, stage_id, 
            expected_close_date, visible_to } = input
    
        const body: v2.UpdateDealRequest = { 
            ...(title !== undefined && { title }),
            ...(value !== undefined && { value }),
            ...(currency !== undefined && { currency }),
            ...(person_id !== undefined && { person_id }),
            ...(org_id !== undefined && { org_id }),
            ...(stage_id !== undefined && { stage_id }),
            ...(expected_close_date !== undefined && { expected_close_date }),
            ...(visible_to !== undefined && { visible_to })
        }
    
        const req: v2.DealsApiUpdateDealRequest = { id: deal_id, UpdateDealRequest: body }
        const res = await dealsApi.updateDeal(req)
    
        return { deal: res.data }
    } catch (error) {
        console.error(error)
        throw new Error(`Failed to update deal: ${error}`)
    }
}

export const findDeal: bp.IntegrationProps['actions']['findDeal'] = async ({ ctx, input }) => {
    try {
        const dealsApi = new v2.DealsApi(await getApiConfig({ ctx }))
        const { term, fields, exact_match, person_id, organization_id } = input
    
    const req: v2.DealsApiSearchDealsRequest = {
        term,
        ...(fields && { fields: fields as DealSearchFields }),
        ...(exact_match !== undefined && { exact_match }),
        ...(typeof person_id === 'number' && person_id > 0 && { person_id }),
        ...(typeof organization_id === 'number' && organization_id > 0 && { organization_id }),
    }
    
        const res = await dealsApi.searchDeals(req)
    
        return { deal: res.data?.items ?? [] }
    } catch (error) {
        console.error(error)
        throw new Error(`Failed to find deal: ${error}`)
    }
}