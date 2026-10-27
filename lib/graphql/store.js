export const CREATE_STORE_MUTATION = `
  mutation CreateStore($input: CreateStoreInput!) {
    createStore(input: $input) {
      id
      name
      slug
      approvalStatus
      businessEmail
      description
    }
  }
`;

export const GET_USER_STORE_QUERY = `
  query GetMyStore {
    myStore {
      id
      merchantId
      name
      slug
      approvalStatus
      businessEmail
      businessPhone
      description
      logoUrl
      address
      isPublished
    }
  }
`;

export const APPROVE_STORE_MUTATION = `
  mutation ApproveStore($id: ID!) {
    approveStore(id: $id) {
      id
      name
      approvalStatus
    }
  }
`;

export const REJECT_STORE_MUTATION = `
  mutation RejectStore($id: ID!, $reason: String!) {
    rejectStore(id: $id, reason: $reason) {
      id
      name
      approvalStatus
      rejectionReason
    }
  }
`;

export const GET_ALL_STORES_QUERY = `
  query GetAllStores($limit: Int, $offset: Int) {
    stores(limit: $limit, offset: $offset) {
      stores {
        id
        name
        slug
        merchantId
        businessEmail
        businessPhone
        description
        logoUrl
        address
        approvalStatus
        createdAt
      }
      total
    }
  }
`;