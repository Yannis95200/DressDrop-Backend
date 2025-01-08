const PostModel = require('../models/post.model');
const UserModel = require('../models/user.model');
const mongoose = require('mongoose');

module.exports.readPost = async (req, res) => {
    try {
        const posts = await PostModel.find();
        res.status(200).json(posts);
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ message: 'Error fetching posts', error: err.message });
    }
};

module.exports.createPost = async (req, res) => {
    if (!req.body.posterId || !req.body.message) {
        return res.status(400).json({ message: "Poster ID and message are required" });
    }

    const newPost = new PostModel({
        posterId: req.body.posterId,
        message: req.body.message,
        video: req.body.video,
        likers: [],
        comments: [],
    });

    try {
        const post = await newPost.save();
        res.status(201).json(post);
    } catch (err) {
        console.error("Error creating post:", err);
        res.status(400).json({ message: "Error creating post", error: err.message });
    }
};

module.exports.updatePost = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).send("ID unknown : " + req.params.id);
    }

    const updatedRecord = { message: req.body.message };

    try {
        const updatedPost = await PostModel.findByIdAndUpdate(
            req.params.id,
            { $set: updatedRecord },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).send({ message: "Post not found" });
        }

        res.status(200).json(updatedPost);
    } catch (err) {
        console.error("Error updating post:", err);
        res.status(500).json({ message: "Error updating post", error: err.message });
    }
};

module.exports.deletePost = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).send("ID unknown : " + req.params.id);
    }

    try {
        const deletedPost = await PostModel.findByIdAndDelete(req.params.id);

        if (!deletedPost) {
            return res.status(404).send({ message: "Post not found" });
        }

        res.status(200).json({ message: "Post successfully deleted", post: deletedPost });
    } catch (err) {
        console.error("Error deleting post:", err);
        res.status(500).json({ message: "Error deleting post", error: err.message });
    }
};

module.exports.likePost = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).send("ID unknown : " + req.params.id);
    }

    try {
        const updatedPost = await PostModel.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { likers: req.body.id } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).send({ message: "Post not found" });
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.body.id,
            { $addToSet: { likes: req.params.id } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).json({ post: updatedPost, user: updatedUser });
    } catch (err) {
        console.error("Error liking post:", err);
        res.status(500).json({ message: "Error liking post", error: err.message });
    }
};

module.exports.unlikePost = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).send("ID unknown : " + req.params.id);
    }

    try {
        const updatedPost = await PostModel.findByIdAndUpdate(
            req.params.id,
            { $pull: { likers: req.body.id } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).send({ message: "Post not found" });
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.body.id,
            { $pull: { likes: req.params.id } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).json({ post: updatedPost, user: updatedUser });
    } catch (err) {
        console.error("Error unliking post:", err);
        res.status(500).json({ message: "Error unliking post", error: err.message });
    }
};


// Ajouter un commentaire
module.exports.addComment = async (req, res) => {
    try {
        const post = await PostModel.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const newComment = {
            commenterId: req.body.commenterId,
            commenterPseudo: req.body.commenterPseudo,
            text: req.body.text,
            timestamp:new Date()

        }

        post.comments.push(newComment);
        await post.save();

        res.status(201).json(post);
    } catch (err) {
        res.status(400).json({ message: "Error adding comment", error: err.message });
    }
};

// Modifier un commentaire
module.exports.editCommentPost = async (req, res) => {
    try {
        const post = await PostModel.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(req.body.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        comment.text = req.body.text;
        await post.save();

        res.status(200).json(post);
    } catch (err) {
        res.status(400).json({ message: "Error editing comment", error: err.message });
    }
};

module.exports.deleteComment = async (req, res) => {
    try {
        const post = await PostModel.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Utilisez pull() pour supprimer le commentaire du tableau
        const commentId = req.body.commentId; // ID du commentaire à supprimer
        const initialCommentsLength = post.comments.length;

        post.comments = post.comments.filter(
            (comment) => comment._id.toString() !== commentId
        );

        if (post.comments.length === initialCommentsLength) {
            return res.status(404).json({ message: "Comment not found" });
        }

        await post.save();

        res.status(200).json({ message: "Comment successfully deleted", post });
    } catch (err) {
        console.error("Error deleting comment:", err);
        res.status(500).json({ message: "Error deleting comment", error: err.message });
    }
};
