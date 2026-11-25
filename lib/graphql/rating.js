export const GET_FLAGGED_RATINGS_QUERY = `
  query GetFlaggedRatings($limit: Int, $offset: Int) {
    getFlaggedRating(limit: $limit, offset: $offset) {
      total
      items {
        flagCount
        rating {
          id
          productId
          userId
          orderId
          rating
          review
          isFlagged
          isHidden
          createdAt
        }
        flags {
          id
          userId
          category
          reason
          createdAt
        }
      }
    }
  }
`;

export const MODERATE_RATING_MUTATION = `
  mutation ModerateRating($input: ModerateRatingInput!) {
    moderateRating(input: $input) {
      success
      message
    }
  }
`;
