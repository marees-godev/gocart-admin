export const CREATE_PRODUCT_MUTATION = `
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      storeId
      categoryId
      sku
      name
      description
      price
      mrp
      tax
      status
      imageUrl
      images
      variants {
        id
        productId
        sku
        name
        price
        mrp
        stock
        attributesJson
        status
        createdAt
        updatedAt
        deletedAt
      }
      avgRating
      createdAt
      updatedAt
      deletedAt
    }
  }
`;

export const GET_PRODUCTS_QUERY = `
  query GetProducts($limit: Int, $offset: Int, $categoryId: String, $storeId: String, $status: ProductStatus) {
    products(limit: $limit, offset: $offset, categoryId: $categoryId, storeId: $storeId, status: $status) {
      products {
        id
        storeId
        categoryId
        sku
        name
        description
        price
        mrp
        tax
        status
        imageUrl
        images
        variants {
          id
          productId
          sku
          name
          price
          mrp
          stock
          attributesJson
          status
        }
        avgRating
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const GET_CATEGORIES_QUERY = `
  query GetCategories($limit: Int, $offset: Int, $parentCategoryId: String, $rootOnly: Boolean) {
    categories(limit: $limit, offset: $offset, parentCategoryId: $parentCategoryId, rootOnly: $rootOnly) {
      categories {
        id
        name
        description
        isActive
        parentCategoryId
      }
      total
    }
  }
`;
