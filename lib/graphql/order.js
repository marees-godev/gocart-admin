export const GET_ORDER_BY_ID_QUERY = `
  query GetOrderById($id: ID!) {
    order(id: $id) {
      id
      userId
      storeId
      status
      orderStatus
      paymentStatus
      items {
        id
        productId
        storeId
        sku
        productName
        quantity
        unitPrice
        tax
        discount
        totalPrice
      }
      subtotal
      taxAmount
      platformFee
      shippingFee
      discountAmount
      totalAmount
      currency
      shippingAddress
      orderNumber
      createdAt
      updatedAt
    }
  }
`;

export const GET_ORDERS_BY_USER_QUERY = `
  query GetOrdersByUser($userId: String!, $limit: Int, $offset: Int) {
    orders(userId: $userId, limit: $limit, offset: $offset) {
      orders {
        id
        userId
        storeId
        status
        orderStatus
        paymentStatus
        items {
          id
          productId
          storeId
          sku
          productName
          quantity
          unitPrice
          tax
          discount
          totalPrice
        }
        subtotal
        taxAmount
        platformFee
        shippingFee
        discountAmount
        totalAmount
        currency
        shippingAddress
        orderNumber
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const UPDATE_ORDER_STATUS_MUTATION = `
  mutation UpdateOrderStatus($id: ID!, $status: String!) {
    updateOrderStatus(id: $id, status: $status) {
      id
      status
      orderStatus
      updatedAt
    }
  }
`;

export const GET_PAYMENT_BY_ORDER_QUERY = `
  query GetPaymentByOrder($orderId: String!) {
    paymentByOrderId(orderId: $orderId) {
      id
      orderId
      amount
      currency
      paymentMethod
      status
      transactionReference
      createdAt
    }
  }
`;

export const CREATE_REFUND_MUTATION = `
  mutation CreateRefund($paymentId: ID!, $amount: Float!, $reason: String, $idempotencyKey: String) {
    createRefund(paymentId: $paymentId, amount: $amount, reason: $reason, idempotencyKey: $idempotencyKey) {
      refundId
      status
      amount
      gatewayRefundId
      createdAt
    }
  }
`;
