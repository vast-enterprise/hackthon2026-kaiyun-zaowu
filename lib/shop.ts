const _SHOP_API_KEY = process.env.SHOP_API_KEY!

export interface OrderParams {
  dimensions: string
  category: string
  quantity: number
  finishType: string
  contactPerson: string
  contactPhone: string
  shippingAddress: string
  country: string
  modelFileUrl: string
  baseEngraving?: string
}

export async function createOrder(_params: OrderParams) {
  // TODO: 实现 Shop 中台下单
  throw new Error('Not implemented')
}
