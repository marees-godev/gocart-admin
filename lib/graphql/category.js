export const GET_CATEGORIES_QUERY = `
  query GetCategories($limit: Int, $offset: Int, $parentCategoryId: String, $rootOnly: Boolean) {
    categories(limit: $limit, offset: $offset, parentCategoryId: $parentCategoryId, rootOnly: $rootOnly) {
      categories {
        id
        name
        parentCategoryId
        description
        isActive
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const CREATE_CATEGORY_MUTATION = `
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      parentCategoryId
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CATEGORY_MUTATION = `
  mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      parentCategoryId
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CATEGORY_MUTATION = `
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id) {
      success
      message
    }
  }
`;
