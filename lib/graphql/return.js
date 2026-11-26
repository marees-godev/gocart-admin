export const LIST_RETURNS_QUERY = `
  query ListReturns($limit: Int, $offset: Int, $status: String) {
    listReturns(limit: $limit, offset: $offset, status: $status) {
      id
      orderId
      orderItemId
      userId
      reason
      status
      type
      refundAmount
      requestedAt
      approvedAt
      completedAt
      rejectionReason
      createdAt
      updatedAt
      verification {
        id
        verifiedBy
        condition
        isApproved
        notes
        verifiedAt
      }
    }
  }
`;

export const APPROVE_RETURN_MUTATION = `
  mutation ApproveReturn($id: ID!) {
    approveReturn(id: $id) {
      id
      status
      approvedAt
      updatedAt
    }
  }
`;

export const REJECT_RETURN_MUTATION = `
  mutation RejectReturn($id: ID!, $reason: String!) {
    rejectReturn(id: $id, reason: $reason) {
      id
      status
      rejectionReason
      updatedAt
    }
  }
`;

export const UPDATE_RETURN_STATUS_MUTATION = `
  mutation UpdateReturnStatus($id: ID!, $status: String!, $rejectionReason: String) {
    updateReturnStatus(id: $id, status: $status, rejectionReason: $rejectionReason) {
      id
      status
      rejectionReason
      updatedAt
    }
  }
`;

export const VERIFY_PRODUCT_MUTATION = `
  mutation VerifyProduct($input: VerifyProductInput!) {
    verifyProduct(input: $input) {
      id
      status
      verification {
        id
        condition
        isApproved
        notes
        verifiedAt
      }
    }
  }
`;

export const GET_EXCHANGE_QUERY = `
  query GetExchange($id: ID!) {
    exchange(id: $id) {
      id
      userId
      productId
      oldBrand
      oldModel
      oldVariant
      serialOrImei
      baseExchangeValue
      estimatedDiscount
      finalDiscount
      priceDifference
      status
      verification {
        id
        conditionRating
        isApproved
        screenIntact
        bodyIntact
        functional
        serialMatches
        adjustedDiscount
        notes
        verifiedAt
      }
      createdAt
    }
  }
`;

export const VERIFY_EXCHANGE_PRODUCT_MUTATION = `
  mutation VerifyExchangeProduct($input: VerifyExchangeProductInput!) {
    verifyExchangeProduct(input: $input) {
      id
      status
      finalDiscount
      priceDifference
      verification {
        id
        conditionRating
        isApproved
        notes
        verifiedAt
      }
    }
  }
`;

export const RESOLVE_EXCHANGE_MISMATCH_MUTATION = `
  mutation ResolveExchangeMismatch($input: ResolveExchangeMismatchInput!) {
    resolveExchangeMismatch(input: $input) {
      id
      status
      finalDiscount
      priceDifference
    }
  }
`;
