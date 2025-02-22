# User Authentication APIs
    Register User (POST /api/auth/register) → Create a new user.
    Login (POST /api/auth/login) → Authenticate user and return a JWT token.
    Logout (POST /api/auth/logout) → Invalidate the refresh token.
    Get Profile (GET /api/auth/profile) → Fetch logged-in user's profile.
    Update Profile (PUT /api/auth/profile) → Edit user details (bio, profile image, etc.).
# Blog APIs
    Create Blog (POST /api/blogs) → Add a new blog post (protected).
    Get All Blogs (GET /api/blogs) → Fetch a list of all blogs (with pagination).
    Get Blog by ID (GET /api/blogs/:blogId) → Fetch details of a specific blog.
    Update Blog (PUT /api/blogs/:blogId) → Edit a blog (only author/admin).
    Delete Blog (DELETE /api/blogs/:blogId) → Remove a blog (only author/admin).
# Comment APIs
    Add Comment (POST /api/blogs/:blogId/comments) → Add a comment to a blog.
    Delete Comment (DELETE /api/blogs/:blogId/comments/:commentId) → Remove a comment (only author/admin).
    Reply to Comment (POST /api/blogs/:blogId/comments/:commentId/replies) → Add a reply to a comment.
# Social & Interaction APIs
    Like Blog (POST /api/blogs/:blogId/like) → Like/unlike a blog.
    Get Likes (GET /api/blogs/:blogId/likes) → Fetch the number of likes on a blog.
    Follow User (POST /api/users/:userId/follow) → Follow/unfollow a user.
    Get Followers/Following (GET /api/users/:userId/social) → Fetch followers and following count.
# Admin APIs (If needed)
    Get All Users (GET /api/admin/users) → Fetch all users (admin only).
    Delete User (DELETE /api/admin/users/:userId) → Remove a user (admin only).