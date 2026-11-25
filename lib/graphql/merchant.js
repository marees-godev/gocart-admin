export const GET_MERCHANTS_QUERY = `
  query GetMerchants($status: MerchantStatus, $lifecycleStatus: MerchantLifecycleStatus, $reactivatedOnly: Boolean, $limit: Int, $offset: Int) {
    merchants(status: $status, lifecycleStatus: $lifecycleStatus, reactivatedOnly: $reactivatedOnly, limit: $limit, offset: $offset) {
      merchants {
        id
        businessName
        firstName
        lastName
        businessEmail
        businessPhone
        panCardNumber
        status
        rejectionReason
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const GET_USER_BY_ID_QUERY = `
  query GetUserById($id: ID!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      role
      phone
      username
      status
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_MERCHANT_STATUS_MUTATION = `
  mutation UpdateMerchantStatus($id: ID!, $status: MerchantStatus!, $rejectionReason: String) {
    updateMerchantStatus(id: $id, status: $status, rejectionReason: $rejectionReason) {
      id
      businessName
      firstName
      lastName
      businessEmail
      status
      rejectionReason
      updatedAt
    }
  }
`;

export const GET_MERCHANT_APPEALS_QUERY = `
  query GetMerchantAppeals($merchantId: ID!) {
    merchantAppeals(merchantId: $merchantId) {
      id
      merchantId
      reason
      status
      adminComment
      reviewedAt
      createdAt
    }
  }
`;
