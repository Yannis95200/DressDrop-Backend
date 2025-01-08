const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const upload = require("../middleware/multer");

router.post("/",postController.createPost);
router.get("/", postController.readPost);
router.put("/:id", postController.updatePost)
router.delete("/:id", postController.deletePost);
router.patch("/like/:id", postController.likePost);
router.patch('/unlike/:id', postController.unlikePost);

//comments
router.patch('/comment-post/:id',postController.addComment)
router.patch('/edit-comment-post/:id', postController.editCommentPost)
router.patch('/delete-comment-post/:id', postController.deleteComment)

module.exports = router;
