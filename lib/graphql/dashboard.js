export const GET_ADMIN_DASHBOARD_QUERY = `
  query GetAdminDashboardStats($limit: Int) {
    products(limit: $limit) {
      total
      products {
        id
        price
        createdAt
      }
    }
    stores(limit: $limit) {
      total
      stores {
        id
        name
        approvalStatus
        createdAt
      }
    }
  }
`;
