// ========================================
// User Module API Routes
// Used for:
// - Controller Routes
// - RabbitMQ Message Patterns
// - API Endpoint Mapping
// ========================================

export const USERS_API_MAPS = {
  // Base Controller Route
  // Example:
  // @Controller(USERS_API_MAPS.CONTROLLER)
  //
  // Final URL:
  // /api/user
  CONTROLLER: 'api/user',

  // ========================================
  // Get User API
  //
  // Example:
  // GET /api/user/get-user
  // ========================================
  GET_USER: 'get-user',

  // ========================================
  // Register New User
  //
  // Example:
  // POST /api/user/register-user
  // ========================================
  REGISTER_USER: 'register-user',

  // ========================================
  // Delete User
  //
  // Example:
  // DELETE /api/user/delete-user
  // ========================================
  DELETE_USER: 'delete-user',

  // ========================================
  // Get Detailed User Information
  //
  // Example:
  // GET /api/user/detailed-user
  // ========================================
  GET_USER_DETAILS: 'detailed-user',

  // ========================================
  // Update User Allocated Storage
  //
  // Example:
  // PATCH /api/user/update-size
  //
  // Used when:
  // - Uploading files
  // - Increasing storage usage
  // - Tracking disk allocation
  // ========================================
  UPDATE_SIZEOF_FILE_ALLOCATED: 'update-size',
};
