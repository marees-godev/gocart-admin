export const GET_APPEAL_DELIVERY_PARTNERS_QUERY = `
  query GetAppealDeliveryPartners {
    appealDeliveryPartners {
      id
      partnerId
      companyName
      email
      contactNumber
      gstin
      isGstinVerified
      isActive
      approvalStatus
      rejectionReason
      appealReason
      appealedAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_DELIVERY_PARTNER_PROFILE_QUERY = `
  query GetDeliveryPartnerProfile($partnerId: ID) {
    deliveryPartnerProfile(partnerId: $partnerId) {
      id
      partnerId
      companyName
      email
      contactNumber
      gstin
      isGstinVerified
      isActive
      approvalStatus
      rejectionReason
      appealReason
      deactivationReason
      appealedAt
      createdAt
      updatedAt
    }
  }
`;

export const APPROVE_DELIVERY_PARTNER_MUTATION = `
  mutation ApproveDeliveryPartner($partnerId: ID!) {
    approveDeliveryPartner(partnerId: $partnerId) {
      id
      partnerId
      companyName
      email
      approvalStatus
      isGstinVerified
      isActive
      updatedAt
    }
  }
`;

export const REJECT_DELIVERY_PARTNER_MUTATION = `
  mutation RejectDeliveryPartner($partnerId: ID!, $reason: String!) {
    rejectDeliveryPartner(partnerId: $partnerId, reason: $reason) {
      id
      partnerId
      companyName
      email
      approvalStatus
      rejectionReason
      updatedAt
    }
  }
`;

export const VERIFY_DELIVERY_PARTNER_GSTIN_MUTATION = `
  mutation VerifyDeliveryPartnerGSTIN($partnerId: ID!) {
    verifyDeliveryPartnerGSTIN(partnerId: $partnerId) {
      id
      partnerId
      companyName
      gstin
      isGstinVerified
      updatedAt
    }
  }
`;

export const GET_DELIVERY_BY_ORDER_QUERY = `
  query DeliveryByOrder($orderId: String!) {
    deliveryByOrder(orderId: $orderId) {
      id
      orderId
      trackingNumber
      status
      estimatedDeliveryAt
      deliveredAt
      deliveryPartner
      shippingAddress
      contactNumber
      createdAt
      updatedAt
    }
  }
`;

export const CANCEL_DELIVERY_MUTATION = `
  mutation CancelDelivery($id: ID!, $reason: String) {
    cancelDelivery(id: $id, reason: $reason) {
      id
      orderId
      status
    }
  }
`;
